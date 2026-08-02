import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/catalog/categories/categories.module';
import { AttributesModule } from './modules/catalog/attributes/attributes.module';
import { BrandsModule } from './modules/catalog/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { WarehousesModule } from './modules/inventory/warehouses/warehouses.module';
import { StockModule } from './modules/inventory/stock/stock.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { CashModule } from './modules/cash/cash.module';
import { SalesModule } from './modules/sales/sales.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { CreditNotesModule } from './modules/creditnotes/credit-notes.module';
import { RecurringInvoicesModule } from './modules/recurring-invoices/recurring-invoices.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    CommonModule,
    BusinessesModule,
    RbacModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    AttributesModule,
    BrandsModule,
    ProductsModule,
    WarehousesModule,
    StockModule,
    CustomersModule,
    PricingModule,
    PromotionsModule,
    CashModule,
    SalesModule,
    PaymentsModule,
    SuppliersModule,
    PurchasesModule,
    LoyaltyModule,
    ReportsModule,
    InvoicingModule,
    QuotesModule,
    VouchersModule,
    CreditNotesModule,
    RecurringInvoicesModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
