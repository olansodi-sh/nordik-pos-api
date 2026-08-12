import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { RecurringInvoice } from './entities/recurring-invoice.entity';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoicesController } from './recurring-invoices.controller';

@Module({
  imports: [TenantOrmModule.forFeature([RecurringInvoice])],
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService],
  exports: [RecurringInvoicesService, TenantOrmModule],
})
export class RecurringInvoicesModule {}
