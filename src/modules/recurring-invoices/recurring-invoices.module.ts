import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringInvoice } from './entities/recurring-invoice.entity';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoicesController } from './recurring-invoices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringInvoice])],
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService],
  exports: [RecurringInvoicesService, TypeOrmModule],
})
export class RecurringInvoicesModule {}
