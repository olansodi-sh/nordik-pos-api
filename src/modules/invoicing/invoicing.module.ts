import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { BusinessInvoicingSettings } from './entities/business-invoicing-settings.entity';
import { SaleElectronicInvoice } from './entities/sale-electronic-invoice.entity';
import { BusinessInvoicingSettingsService } from './business-invoicing-settings.service';
import { SaleElectronicInvoicesService } from './sale-electronic-invoices.service';
import { InvoicingController } from './invoicing.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([
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
    TenantOrmModule,
  ],
})
export class InvoicingModule {}
