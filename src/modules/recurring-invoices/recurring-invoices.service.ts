import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import {
  RecurringInvoice,
  RecurringInvoiceFrequency,
} from './entities/recurring-invoice.entity';

@Injectable()
export class RecurringInvoicesService extends TenantScopedService<RecurringInvoice> {
  constructor(
    @InjectRepository(RecurringInvoice)
    repository: Repository<RecurringInvoice>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Avanza `nextRun` según la frecuencia. La generación automática de la
   * venta (vía un scheduler/cron) queda para una fase posterior; por ahora
   * esto solo administra la programación.
   */
  async advanceNextRun(id: string): Promise<RecurringInvoice> {
    const invoice = await this.findOneOrFail(id);
    const next = new Date(invoice.nextRun);
    if (invoice.frequency === RecurringInvoiceFrequency.WEEKLY) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    return this.update(id, { nextRun: next.toISOString().slice(0, 10) });
  }
}
