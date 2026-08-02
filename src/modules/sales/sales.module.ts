import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleLine]),
    WarehousesModule,
    ProductsModule,
    CustomersModule,
    PricingModule,
    PromotionsModule,
    LoyaltyModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService, TypeOrmModule],
})
export class SalesModule {}
