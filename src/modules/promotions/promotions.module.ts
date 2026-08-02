import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { PromotionTarget } from './entities/promotion-target.entity';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, PromotionTarget])],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService, TypeOrmModule],
})
export class PromotionsModule {}
