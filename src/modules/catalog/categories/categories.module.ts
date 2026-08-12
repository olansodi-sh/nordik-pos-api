import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../../database/tenant/tenant-orm.module';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, TenantOrmModule],
})
export class CategoriesModule {}
