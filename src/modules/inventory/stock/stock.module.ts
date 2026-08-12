import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../../database/tenant/tenant-orm.module';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockService } from './stock.service';
import { StockMovementsService } from './stock-movements.service';
import { StockController } from './stock.controller';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { ProductsModule } from '../../products/products.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([Stock, StockMovement]),
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [StockController],
  providers: [StockService, StockMovementsService],
  exports: [StockService, StockMovementsService, TenantOrmModule],
})
export class StockModule {}
