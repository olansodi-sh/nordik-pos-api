import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../../database/tenant/tenant-orm.module';
import { Brand } from './entities/brand.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Brand])],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService, TenantOrmModule],
})
export class BrandsModule {}
