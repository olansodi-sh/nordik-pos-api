import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { Stock } from '../inventory/stock/entities/stock.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { WarehousesService } from '../inventory/warehouses/warehouses.service';
import { ProductsService } from '../products/products.service';
import { ProductVariantsService } from '../products/product-variants.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { PurchaseLineInputDto } from './dto/purchase-line-input.dto';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';

@Injectable()
export class PurchaseInvoicesService extends TenantScopedService<PurchaseInvoice> {
  constructor(
    @InjectRepository(PurchaseInvoice) repository: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceLine)
    private readonly linesRepository: Repository<PurchaseInvoiceLine>,
    private readonly dataSource: DataSource,
    private readonly suppliersService: SuppliersService,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly productVariantsService: ProductVariantsService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async findLines(invoiceId: string): Promise<PurchaseInvoiceLine[]> {
    await this.findOneOrFail(invoiceId);
    return this.linesRepository.find({ where: { invoiceId } });
  }

  async createInvoice(dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    if (!dto.lines.length) {
      throw new BadRequestException('La factura debe tener al menos una línea');
    }

    await this.suppliersService.findOneOrFail(dto.supplierId);
    await this.warehousesService.findOneOrFail(dto.warehouseId);

    const tracksInventory = await Promise.all(
      dto.lines.map((line) => this.resolveTracksInventory(line)),
    );
    const total = dto.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitCost,
      0,
    );

    return this.dataSource.transaction(async (manager) => {
      const invoiceRepo = manager.getRepository(PurchaseInvoice);
      const lineRepo = manager.getRepository(PurchaseInvoiceLine);
      const stockRepo = manager.getRepository(Stock);

      const invoice = await invoiceRepo.save(
        invoiceRepo.create({
          businessId: this.tenantContext.businessId,
          number: generateDocumentNumber('FC'),
          documentType: dto.documentType,
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          supplierDocNumber: dto.supplierDocNumber ?? null,
          total,
          date: dto.date ?? new Date().toISOString().slice(0, 10),
        }),
      );

      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];
        await lineRepo.save(
          lineRepo.create({
            invoiceId: invoice.id,
            variantId: line.variantId ?? null,
            productId: line.productId ?? null,
            description: line.description ?? '',
            quantity: line.quantity,
            unitCost: line.unitCost,
            total: line.quantity * line.unitCost,
          }),
        );

        if (tracksInventory[i]) {
          await this.incrementStock(stockRepo, dto.warehouseId, line);
        }
      }

      return invoice;
    });
  }

  private async resolveTracksInventory(
    line: PurchaseLineInputDto,
  ): Promise<boolean> {
    if (!line.variantId && !line.productId) {
      throw new BadRequestException(
        'Cada línea debe indicar variantId o productId',
      );
    }
    if (line.variantId) {
      const variant = await this.productVariantsService.findVariantByIdOrFail(
        line.variantId,
      );
      return variant.product.tracksInventory;
    }
    const product = await this.productsService.findOneOrFail(
      line.productId as string,
    );
    return product.tracksInventory;
  }

  private async incrementStock(
    stockRepo: Repository<Stock>,
    warehouseId: string,
    line: PurchaseLineInputDto,
  ): Promise<void> {
    const where = line.variantId
      ? { variantId: line.variantId, warehouseId }
      : { productId: line.productId, warehouseId };

    const stock = await stockRepo.findOne({ where });
    if (stock) {
      stock.quantity = Number(stock.quantity) + line.quantity;
      await stockRepo.save(stock);
    } else {
      await stockRepo.save(
        stockRepo.create({
          variantId: line.variantId ?? null,
          productId: line.productId ?? null,
          warehouseId,
          quantity: line.quantity,
        }),
      );
    }
  }
}
