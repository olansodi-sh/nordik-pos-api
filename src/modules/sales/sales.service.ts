import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Sale, SaleStatus, SalesChannel } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import { CreateSaleDto, CreateSaleLineDto } from './dto/create-sale.dto';
import { generateSaleNumber } from './utils/sale-number-generator.util';
import { WarehousesService } from '../inventory/warehouses/warehouses.service';
import { Stock } from '../inventory/stock/entities/stock.entity';
import { ProductsService } from '../products/products.service';
import { ProductVariantsService } from '../products/product-variants.service';
import { CustomersService } from '../customers/customers.service';
import { PriceListsService } from '../pricing/price-lists.service';
import { PriceListItemsService } from '../pricing/price-list-items.service';
import { PromotionsService } from '../promotions/promotions.service';
import {
  Promotion,
  PromotionType,
} from '../promotions/entities/promotion.entity';
import { LoyaltyPointsService } from '../loyalty/loyalty-points.service';

interface ResolvedLine {
  variantId?: string;
  productId?: string;
  name: string;
  categoryId?: string;
  tracksInventory: boolean;
  fallbackPrice: number;
}

@Injectable()
export class SalesService extends TenantScopedService<Sale> {
  constructor(
    @InjectRepository(Sale) repository: Repository<Sale>,
    @InjectRepository(SaleLine)
    private readonly saleLinesRepository: Repository<SaleLine>,
    private readonly dataSource: DataSource,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly productVariantsService: ProductVariantsService,
    private readonly customersService: CustomersService,
    private readonly priceListsService: PriceListsService,
    private readonly priceListItemsService: PriceListItemsService,
    private readonly promotionsService: PromotionsService,
    private readonly loyaltyPointsService: LoyaltyPointsService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async findLines(saleId: string): Promise<SaleLine[]> {
    await this.findOneOrFail(saleId);
    return this.saleLinesRepository.find({ where: { saleId } });
  }

  async createSale(dto: CreateSaleDto): Promise<Sale> {
    if (!dto.lines.length) {
      throw new BadRequestException('La venta debe tener al menos una línea');
    }
    if (!this.tenantContext.currentUser?.userId) {
      throw new BadRequestException('No hay usuario autenticado');
    }

    await this.warehousesService.findOneOrFail(dto.warehouseId);

    const priceListId = await this.resolvePriceListId(
      dto.customerId,
      dto.priceListId,
    );

    const resolvedLines = await Promise.all(
      dto.lines.map((line) => this.resolveLine(line)),
    );

    let subtotal = 0;
    let totalDiscount = 0;
    const lineInputs: {
      resolved: ResolvedLine;
      quantity: number;
      unitPrice: number;
      discount: number;
      promotionId: string | null;
      total: number;
    }[] = [];

    for (let i = 0; i < dto.lines.length; i++) {
      const line = dto.lines[i];
      const resolved = resolvedLines[i];

      let unitPrice: number;
      let discount: number;
      let promotionId: string | null;

      if (line.unitPrice !== undefined) {
        // Precio pactado explícitamente (ej. conversión de cotización):
        // no se resuelve lista de precios ni promociones.
        unitPrice = line.unitPrice;
        discount = line.discount ?? 0;
        promotionId = null;
      } else {
        const listPrice = await this.priceListItemsService.resolvePrice(
          priceListId,
          {
            variantId: resolved.variantId,
            productId: resolved.productId,
          },
        );
        unitPrice = listPrice ?? resolved.fallbackPrice;

        ({ discount, promotionId } = await this.resolveDiscount(
          resolved,
          line.quantity,
          unitPrice,
        ));
      }

      const total = unitPrice * line.quantity - discount;
      subtotal += unitPrice * line.quantity;
      totalDiscount += discount;

      lineInputs.push({
        resolved,
        quantity: line.quantity,
        unitPrice,
        discount,
        promotionId,
        total,
      });
    }

    const total = subtotal - totalDiscount;

    const sale = await this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const lineRepo = manager.getRepository(SaleLine);

      const sale = await saleRepo.save(
        saleRepo.create({
          businessId: this.tenantContext.businessId,
          number: generateSaleNumber(),
          channel: dto.channel ?? SalesChannel.POS,
          customerId: dto.customerId ?? null,
          priceListId,
          warehouseId: dto.warehouseId,
          userId: this.tenantContext.currentUser?.userId as string,
          cashSessionId: dto.cashSessionId ?? null,
          subtotal,
          discount: totalDiscount,
          tax: 0,
          total,
          paidAmount: 0,
          status: SaleStatus.CONFIRMED,
          date: dto.date ? new Date(dto.date) : new Date(),
        }),
      );

      for (const input of lineInputs) {
        await lineRepo.save(
          lineRepo.create({
            saleId: sale.id,
            variantId: input.resolved.variantId ?? null,
            productId: input.resolved.productId ?? null,
            description: input.resolved.name,
            quantity: input.quantity,
            unitPrice: input.unitPrice,
            discount: input.discount,
            promotionId: input.promotionId,
            tax: 0,
            total: input.total,
          }),
        );

        if (input.resolved.tracksInventory) {
          await this.decrementStock(manager.getRepository(Stock), {
            warehouseId: dto.warehouseId,
            variantId: input.resolved.variantId,
            productId: input.resolved.productId,
            quantity: input.quantity,
            productName: input.resolved.name,
          });
        }
      }

      return sale;
    });

    if (sale.customerId) {
      // No debe tumbar la venta si la acumulación de puntos falla.
      await this.loyaltyPointsService
        .awardForSale(sale.customerId, sale.id, Number(sale.total))
        .catch(() => undefined);
    }

    return sale;
  }

  /**
   * Descuenta stock dentro de la misma transacción de la venta (no delega
   * a StockService, que usa su propio repositorio fuera de la transacción
   * — eso rompería la atomicidad si algo falla a mitad de la venta).
   */
  private async decrementStock(
    stockRepo: Repository<Stock>,
    params: {
      warehouseId: string;
      variantId?: string;
      productId?: string;
      quantity: number;
      productName: string;
    },
  ): Promise<void> {
    const where = params.variantId
      ? { variantId: params.variantId, warehouseId: params.warehouseId }
      : { productId: params.productId, warehouseId: params.warehouseId };

    const stock = await stockRepo.findOne({ where });
    const currentQty = stock ? Number(stock.quantity) : 0;

    if (currentQty < params.quantity) {
      throw new BadRequestException(
        `Stock insuficiente para "${params.productName}" en la bodega seleccionada (disponible: ${currentQty})`,
      );
    }

    if (stock) {
      stock.quantity = currentQty - params.quantity;
      await stockRepo.save(stock);
    } else {
      // No debería pasar (currentQty sería 0 y ya se habría lanzado arriba
      // si params.quantity > 0), pero se deja por completitud.
      await stockRepo.save(
        stockRepo.create({
          variantId: params.variantId ?? null,
          productId: params.productId ?? null,
          warehouseId: params.warehouseId,
          quantity: -params.quantity,
        }),
      );
    }
  }

  private async resolvePriceListId(
    customerId?: string,
    explicitId?: string,
  ): Promise<string> {
    if (explicitId) {
      const list = await this.priceListsService.findOneOrFail(explicitId);
      return list.id;
    }

    if (customerId) {
      const customer = await this.customersService.findOneOrFail(customerId);
      if (customer.defaultPriceListId) {
        return customer.defaultPriceListId;
      }
    }

    const defaultList = await this.priceListsService.findDefault();
    if (!defaultList) {
      throw new BadRequestException(
        'El negocio no tiene una lista de precios por defecto',
      );
    }
    return defaultList.id;
  }

  private async resolveLine(line: CreateSaleLineDto): Promise<ResolvedLine> {
    if (!line.variantId && !line.productId) {
      throw new BadRequestException(
        'Cada línea debe indicar variantId o productId',
      );
    }
    if (line.variantId && line.productId) {
      throw new BadRequestException(
        'Cada línea solo puede indicar variantId o productId',
      );
    }

    if (line.variantId) {
      const variant = await this.productVariantsService.findVariantByIdOrFail(
        line.variantId,
      );
      return {
        variantId: variant.id,
        name: variant.product.name,
        categoryId: variant.product.categoryId ?? undefined,
        tracksInventory: variant.product.tracksInventory,
        fallbackPrice: variant.listPrice ? Number(variant.listPrice) : 0,
      };
    }

    const product = await this.productsService.findOneOrFail(
      line.productId as string,
    );
    if (product.hasVariants) {
      throw new BadRequestException(
        `El producto ${product.name} maneja variantes: indica variantId en vez de productId`,
      );
    }
    return {
      productId: product.id,
      name: product.name,
      categoryId: product.categoryId ?? undefined,
      tracksInventory: product.tracksInventory,
      fallbackPrice: 0,
    };
  }

  private async resolveDiscount(
    resolved: ResolvedLine,
    quantity: number,
    unitPrice: number,
  ): Promise<{ discount: number; promotionId: string | null }> {
    const promotions = await this.promotionsService.findApplicableForLine({
      variantId: resolved.variantId,
      productId: resolved.productId,
      categoryId: resolved.categoryId,
    });

    if (!promotions.length) {
      return { discount: 0, promotionId: null };
    }

    // Para el MVP se aplica una sola promoción por línea (la primera que matchea).
    const promotion = promotions[0];
    return {
      discount: this.computeDiscount(promotion, quantity, unitPrice),
      promotionId: promotion.id,
    };
  }

  private computeDiscount(
    promotion: Promotion,
    quantity: number,
    unitPrice: number,
  ): number {
    switch (promotion.type) {
      case PromotionType.PERCENTAGE:
        return (unitPrice * quantity * Number(promotion.value ?? 0)) / 100;
      case PromotionType.FIXED_AMOUNT:
        return Math.min(
          Number(promotion.value ?? 0) * quantity,
          unitPrice * quantity,
        );
      case PromotionType.BUY_X_GET_Y: {
        const { buyQty, getQty } = promotion.conditions ?? {
          buyQty: 0,
          getQty: 0,
        };
        if (!buyQty || !getQty) return 0;
        const groupSize = buyQty + getQty;
        const freeUnits = Math.floor(quantity / groupSize) * getQty;
        return freeUnits * unitPrice;
      }
      default:
        return 0;
    }
  }
}
