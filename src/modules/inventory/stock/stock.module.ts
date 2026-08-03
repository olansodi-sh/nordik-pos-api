import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockService } from './stock.service';
import { StockMovementsService } from './stock-movements.service';
import { StockController } from './stock.controller';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { ProductsModule } from '../../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, StockMovement]),
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [StockController],
  providers: [StockService, StockMovementsService],
  exports: [StockService, StockMovementsService, TypeOrmModule],
})
export class StockModule {}
