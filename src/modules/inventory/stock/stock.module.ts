import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { ProductsModule } from '../../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock]),
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService, TypeOrmModule],
})
export class StockModule {}
