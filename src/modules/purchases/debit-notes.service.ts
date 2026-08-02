import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { DebitNote } from './entities/debit-note.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { CreateDebitNoteDto } from './dto/create-debit-note.dto';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';

@Injectable()
export class DebitNotesService extends TenantScopedService<DebitNote> {
  constructor(
    @InjectRepository(DebitNote) repository: Repository<DebitNote>,
    private readonly suppliersService: SuppliersService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createDebitNote(dto: CreateDebitNoteDto): Promise<DebitNote> {
    await this.suppliersService.findOneOrFail(dto.supplierId);

    return this.create({
      number: generateDocumentNumber('ND'),
      supplierId: dto.supplierId,
      purchaseInvoiceId: dto.purchaseInvoiceId ?? null,
      amount: dto.amount,
      reason: dto.reason ?? null,
      date: dto.date ?? new Date().toISOString().slice(0, 10),
    });
  }
}
