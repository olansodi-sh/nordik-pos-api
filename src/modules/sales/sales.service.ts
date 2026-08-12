import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TENANT_DATA_SOURCE } from '../../database/tenant/tenant-orm.module';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Sale, SaleStatus, SalesChannel } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import {
  AddSaleLinesDto,
  CreateSaleDto,
  CreateSaleLineDto,
} from './dto/create-sale.dto';
import { VoidSaleDto } from './dto/void-sale.dto';
import { generateSaleNumber } from './utils/sale-number-generator.util';
import { WarehousesService } from '../inventory/warehouses/warehouses.service';
import { Stock } from '../inventory/stock/entities/stock.entity';
import { StockMovementType } from '../inventory/stock/entities/stock-movement.entity';
import { StockMovementsService } from '../inventory/stock/stock-movements.service';
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
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { CustomizableEntityType } from '../custom-fields/entities/custom-field-definition.entity';

interface ResolvedLine {
  variantId?: string;
  productId?: string;
  name: string;
  categoryId?: string;
  tracksInventory: boolean;
  fallbackPrice: number;
}

interface LineInput {
  resolved: ResolvedLine;
  quantity: number;
  unitPrice: number;
  discount: number;
  promotionId: string | null;
  total: number;
}

@Injectable()
export class SalesService extends TenantScopedService<Sale> {
  constructor(
    @InjectRepository(Sale) repository: Repository<Sale>,
    @InjectRepository(SaleLine)
    private readonly saleLinesRepository: Repository<SaleLine>,
    @Inject(TENANT_DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly productVariantsService: ProductVariantsService,
    private readonly customersService: CustomersService,
    private readonly priceListsService: PriceListsService,
    private readonly priceListItemsService: PriceListItemsService,
    private readonly promotionsService: PromotionsService,
    private readonly loyaltyPointsService: LoyaltyPointsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly customFieldsService: CustomFieldsService,
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

    const lineInputs = await this.buildLineInputs(dto.lines, priceListId);
    const subtotal = lineInputs.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0,
    );
    const totalDiscount = lineInputs.reduce((sum, l) => sum + l.discount, 0);
    const total = subtotal - totalDiscount;
    const customFields = await this.customFieldsService.validate(
      CustomizableEntityType.SALE,
      dto.customFields,
    );

    const sale = await this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);

      const sale = await saleRepo.save(
        saleRepo.create({
          number: generateSaleNumber(),
          channel: dto.channel ?? SalesChannel.POS,
          customerId: dto.customerId ?? null,
          priceListId,
          warehouseId: dto.warehouseId,
          userId: this.tenantContext.currentUser?.userId as string,
          cashSessionId: dto.cashSessionId ?? null,
          label: dto.label ?? null,
          subtotal,
          discount: totalDiscount,
          tax: 0,
          total,
          paidAmount: 0,
          status: SaleStatus.CONFIRMED,
          date: dto.date ? new Date(dto.date) : new Date(),
          customFields,
        }),
      );

      await this.persistLines(manager, sale, dto.warehouseId, lineInputs);

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
   * Agrega líneas a una venta existente sin cerrar (confirmada o con pago
   * parcial) — soporta el flujo de "cuenta abierta" (mesa, fiado) donde se
   * van sumando productos antes de cobrar.
   */
  async addLines(saleId: string, dto: AddSaleLinesDto): Promise<Sale> {
    if (!dto.lines.length) {
      throw new BadRequestException('Debes indicar al menos una línea');
    }

    const sale = await this.findOneOrFail(saleId);
    if (
      sale.status !== SaleStatus.CONFIRMED &&
      sale.status !== SaleStatus.PARTIAL
    ) {
      throw new BadRequestException(
        'Solo se pueden agregar productos a ventas confirmadas o con pago parcial',
      );
    }

    const priceListId =
      sale.priceListId ??
      (await this.resolvePriceListId(sale.customerId ?? undefined, undefined));
    const lineInputs = await this.buildLineInputs(dto.lines, priceListId);
    const addedSubtotal = lineInputs.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0,
    );
    const addedDiscount = lineInputs.reduce((sum, l) => sum + l.discount, 0);

    return this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);

      await this.persistLines(manager, sale, sale.warehouseId, lineInputs);

      sale.subtotal = Number(sale.subtotal) + addedSubtotal;
      sale.discount = Number(sale.discount) + addedDiscount;
      sale.total = Number(sale.subtotal) - Number(sale.discount);
      return saleRepo.save(sale);
    });
  }

  /**
   * Anula una venta completa: revierte el inventario descontado y deja
   * registrado el motivo, quién y cuándo. Bloqueada si ya tiene pagos
   * aplicados (para esos casos se usa una nota crédito, que no revierte
   * el pago automáticamente).
   */
  async voidSale(saleId: string, dto: VoidSaleDto): Promise<Sale> {
    const sale = await this.findOneOrFail(saleId);
    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Esta venta ya está anulada');
    }
    if (Number(sale.paidAmount) > 0) {
      throw new BadRequestException(
        'Esta venta ya tiene pagos registrados: usa una nota crédito en vez de anularla',
      );
    }

    const lines = await this.saleLinesRepository.find({ where: { saleId } });

    return this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const stockRepo = manager.getRepository(Stock);

      for (const line of lines) {
        const product = line.variantId
          ? (
              await this.productVariantsService.findVariantByIdOrFail(
                line.variantId,
              )
            ).product
          : await this.productsService.findOneOrFail(line.productId as string);

        if (!product.tracksInventory) continue;

        await this.restockLine(stockRepo, manager, {
          variantId: line.variantId,
          productId: line.productId,
          warehouseId: sale.warehouseId,
          quantity: Number(line.quantity),
          refId: sale.id,
        });
      }

      sale.status = SaleStatus.CANCELLED;
      sale.voidReason = dto.reason;
      sale.voidedAt = new Date();
      sale.voidedBy = this.tenantContext.currentUser?.userId ?? null;

      return saleRepo.save(sale);
    });
  }

  private async persistLines(
    manager: EntityManager,
    sale: Sale,
    warehouseId: string,
    lineInputs: LineInput[],
  ): Promise<void> {
    const lineRepo = manager.getRepository(SaleLine);
    const stockRepo = manager.getRepository(Stock);

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
        await this.decrementStock(manager, stockRepo, {
          warehouseId,
          variantId: input.resolved.variantId,
          productId: input.resolved.productId,
          quantity: input.quantity,
          productName: input.resolved.name,
          saleId: sale.id,
        });
      }
    }
  }

  private async buildLineInputs(
    lines: CreateSaleLineDto[],
    priceListId: string,
  ): Promise<LineInput[]> {
    const resolvedLines = await Promise.all(
      lines.map((line) => this.resolveLine(line)),
    );

    const lineInputs: LineInput[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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

      lineInputs.push({
        resolved,
        quantity: line.quantity,
        unitPrice,
        discount,
        promotionId,
        total,
      });
    }

    return lineInputs;
  }

  /**
   * Descuenta stock dentro de la misma transacción de la venta (no delega
   * a StockService, que usa su propio repositorio fuera de la transacción
   * — eso rompería la atomicidad si algo falla a mitad de la venta).
   */
  private async decrementStock(
    manager: EntityManager,
    stockRepo: Repository<Stock>,
    params: {
      warehouseId: string;
      variantId?: string;
      productId?: string;
      quantity: number;
      productName: string;
      saleId: string;
    },
  ): Promise<void> {
    const where = params.variantId
      ? { variantId: params.variantId, warehouseId: params.warehouseId }
      : { productId: params.productId, warehouseId: params.warehouseId };

    let stock = await stockRepo.findOne({ where });
    const currentQty = stock ? Number(stock.quantity) : 0;

    if (currentQty < params.quantity) {
      throw new BadRequestException(
        `Stock insuficiente para "${params.productName}" en la bodega seleccionada (disponible: ${currentQty})`,
      );
    }

    if (stock) {
      stock.quantity = currentQty - params.quantity;
      stock = await stockRepo.save(stock);
    } else {
      // No debería pasar (currentQty sería 0 y ya se habría lanzado arriba
      // si params.quantity > 0), pero se deja por completitud.
      stock = await stockRepo.save(
        stockRepo.create({
          variantId: params.variantId ?? null,
          productId: params.productId ?? null,
          warehouseId: params.warehouseId,
          quantity: -params.quantity,
        }),
      );
    }

    await this.stockMovementsService.record(
      {
        businessId: this.tenantContext.businessId,
        variantId: params.variantId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantityDelta: -params.quantity,
        quantityAfter: Number(stock.quantity),
        type: StockMovementType.SALE,
        refType: 'sale',
        refId: params.saleId,
        userId: this.tenantContext.currentUser?.userId,
      },
      manager,
    );
  }

  private async restockLine(
    stockRepo: Repository<Stock>,
    manager: EntityManager,
    params: {
      variantId?: string | null;
      productId?: string | null;
      warehouseId: string;
      quantity: number;
      refId: string;
    },
  ): Promise<void> {
    const where = params.variantId
      ? { variantId: params.variantId, warehouseId: params.warehouseId }
      : {
          productId: params.productId ?? undefined,
          warehouseId: params.warehouseId,
        };

    let stock = await stockRepo.findOne({ where });
    const before = stock ? Number(stock.quantity) : 0;

    if (stock) {
      stock.quantity = before + params.quantity;
      stock = await stockRepo.save(stock);
    } else {
      stock = await stockRepo.save(
        stockRepo.create({
          variantId: params.variantId ?? null,
          productId: params.productId ?? null,
          warehouseId: params.warehouseId,
          quantity: params.quantity,
        }),
      );
    }

    await this.stockMovementsService.record(
      {
        businessId: this.tenantContext.businessId,
        variantId: params.variantId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantityDelta: params.quantity,
        quantityAfter: Number(stock.quantity),
        type: StockMovementType.SALE_VOID,
        refType: 'sale',
        refId: params.refId,
        userId: this.tenantContext.currentUser?.userId,
      },
      manager,
    );
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
