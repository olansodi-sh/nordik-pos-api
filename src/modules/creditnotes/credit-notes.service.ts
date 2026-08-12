import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TENANT_DATA_SOURCE } from '../../database/tenant/tenant-orm.module';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';
import { CreditNote } from './entities/credit-note.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Stock } from '../inventory/stock/entities/stock.entity';
import { StockMovementType } from '../inventory/stock/entities/stock-movement.entity';
import { StockMovementsService } from '../inventory/stock/stock-movements.service';
import { Voucher, VoucherStatus } from '../vouchers/entities/voucher.entity';
import {
  CreateCreditNoteDto,
  RestockLineInputDto,
} from './dto/create-credit-note.dto';

@Injectable()
export class CreditNotesService extends TenantScopedService<CreditNote> {
  constructor(
    @InjectRepository(CreditNote) repository: Repository<CreditNote>,
    @Inject(TENANT_DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly stockMovementsService: StockMovementsService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createCreditNote(dto: CreateCreditNoteDto): Promise<CreditNote> {
    return this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const sale = await saleRepo.findOne({
        where: { id: dto.saleId },
      });
      if (!sale) {
        throw new BadRequestException(`Venta ${dto.saleId} no encontrada`);
      }

      let voucherId: string | null = null;
      if (dto.generateVoucher) {
        const voucherRepo = manager.getRepository(Voucher);
        const voucher = await voucherRepo.save(
          voucherRepo.create({
            code: generateDocumentNumber('VL'),
            customerId: dto.customerId ?? null,
            amount: dto.amount,
            balance: dto.amount,
            status: VoucherStatus.ACTIVE,
            reason: dto.reason ?? 'Nota crédito',
          }),
        );
        voucherId = voucher.id;
      }

      const noteRepo = manager.getRepository(CreditNote);
      const note = await noteRepo.save(
        noteRepo.create({
          number: generateDocumentNumber('NC'),
          saleId: dto.saleId,
          customerId: dto.customerId ?? null,
          type: dto.type,
          amount: dto.amount,
          reason: dto.reason ?? null,
          restock: dto.restock ?? false,
          voucherId,
        }),
      );

      if (dto.restock && dto.restockLines?.length) {
        const stockRepo = manager.getRepository(Stock);
        for (const line of dto.restockLines) {
          await this.incrementStock(stockRepo, line, note.id, manager);
        }
      }

      return note;
    });
  }

  private async incrementStock(
    stockRepo: Repository<Stock>,
    line: RestockLineInputDto,
    creditNoteId: string,
    manager: EntityManager,
  ): Promise<void> {
    const where = line.variantId
      ? { variantId: line.variantId, warehouseId: line.warehouseId }
      : { productId: line.productId, warehouseId: line.warehouseId };

    let stock = await stockRepo.findOne({ where });
    const before = stock ? Number(stock.quantity) : 0;

    if (stock) {
      stock.quantity = before + line.quantity;
      stock = await stockRepo.save(stock);
    } else {
      stock = await stockRepo.save(
        stockRepo.create({
          variantId: line.variantId ?? null,
          productId: line.productId ?? null,
          warehouseId: line.warehouseId,
          quantity: line.quantity,
        }),
      );
    }

    await this.stockMovementsService.record(
      {
        businessId: this.tenantContext.businessId,
        variantId: line.variantId,
        productId: line.productId,
        warehouseId: line.warehouseId,
        quantityDelta: line.quantity,
        quantityAfter: Number(stock.quantity),
        type: StockMovementType.CREDIT_NOTE_RESTOCK,
        refType: 'credit_note',
        refId: creditNoteId,
        userId: this.tenantContext.currentUser?.userId,
      },
      manager,
    );
  }
}
