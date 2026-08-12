import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TENANT_DATA_SOURCE } from '../../database/tenant/tenant-orm.module';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { Stock } from '../inventory/stock/entities/stock.entity';
import { StockMovementType } from '../inventory/stock/entities/stock-movement.entity';
import { StockMovementsService } from '../inventory/stock/stock-movements.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { WarehousesService } from '../inventory/warehouses/warehouses.service';
import { ProductsService } from '../products/products.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { PurchaseLineInputDto } from './dto/purchase-line-input.dto';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';

@Injectable()
export class PurchaseInvoicesService extends TenantScopedService<PurchaseInvoice> {
  constructor(
    @InjectRepository(PurchaseInvoice) repository: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceLine)
    private readonly linesRepository: Repository<PurchaseInvoiceLine>,
    @Inject(TENANT_DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly suppliersService: SuppliersService,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService,
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
            productId: line.productId,
            description: line.description ?? '',
            quantity: line.quantity,
            unitCost: line.unitCost,
            total: line.quantity * line.unitCost,
          }),
        );

        if (tracksInventory[i]) {
          await this.incrementStock(
            stockRepo,
            dto.warehouseId,
            line,
            invoice.id,
            manager,
          );
        }
      }

      return invoice;
    });
  }

  private async resolveTracksInventory(
    line: PurchaseLineInputDto,
  ): Promise<boolean> {
    const product = await this.productsService.findOneOrFail(line.productId);
    return product.tracksInventory;
  }

  private async incrementStock(
    stockRepo: Repository<Stock>,
    warehouseId: string,
    line: PurchaseLineInputDto,
    invoiceId: string,
    manager: EntityManager,
  ): Promise<void> {
    const where = { productId: line.productId, warehouseId };

    let stock = await stockRepo.findOne({ where });
    const before = stock ? Number(stock.quantity) : 0;

    if (stock) {
      stock.quantity = before + line.quantity;
      stock = await stockRepo.save(stock);
    } else {
      stock = await stockRepo.save(
        stockRepo.create({
          productId: line.productId,
          warehouseId,
          quantity: line.quantity,
        }),
      );
    }

    await this.stockMovementsService.record(
      {
        businessId: this.tenantContext.businessId,
        productId: line.productId,
        warehouseId,
        quantityDelta: line.quantity,
        quantityAfter: Number(stock.quantity),
        type: StockMovementType.PURCHASE,
        refType: 'purchase_invoice',
        refId: invoiceId,
        userId: this.tenantContext.currentUser?.userId,
      },
      manager,
    );
  }
}
