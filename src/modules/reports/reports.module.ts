import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Sale } from '../sales/entities/sale.entity';
import { Stock } from '../inventory/stock/entities/stock.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Sale, Stock])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
