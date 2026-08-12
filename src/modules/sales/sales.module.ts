import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Sale } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { WarehousesModule } from '../inventory/warehouses/warehouses.module';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { PricingModule } from '../pricing/pricing.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { StockModule } from '../inventory/stock/stock.module';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([Sale, SaleLine]),
    WarehousesModule,
    ProductsModule,
    CustomersModule,
    PricingModule,
    PromotionsModule,
    LoyaltyModule,
    StockModule,
    CustomFieldsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, TenantOrmModule],
})
export class SalesModule {}
