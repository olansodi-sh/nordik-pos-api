import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Promotion } from './entities/promotion.entity';
import { PromotionTarget } from './entities/promotion-target.entity';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Promotion, PromotionTarget])],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService, TenantOrmModule],
})
export class PromotionsModule {}
