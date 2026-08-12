import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../../database/tenant/tenant-orm.module';
import { Warehouse } from './entities/warehouse.entity';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Warehouse])],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService, TenantOrmModule],
})
export class WarehousesModule {}
