import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessInvoicingSettings } from './entities/business-invoicing-settings.entity';
import { SaleElectronicInvoice } from './entities/sale-electronic-invoice.entity';
import { BusinessInvoicingSettingsService } from './business-invoicing-settings.service';
import { SaleElectronicInvoicesService } from './sale-electronic-invoices.service';
import { InvoicingController } from './invoicing.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessInvoicingSettings,
      SaleElectronicInvoice,
    ]),
    SalesModule,
  ],
  controllers: [InvoicingController],
  providers: [BusinessInvoicingSettingsService, SaleElectronicInvoicesService],
  exports: [
    BusinessInvoicingSettingsService,
    SaleElectronicInvoicesService,
    TypeOrmModule,
  ],
})
export class InvoicingModule {}
