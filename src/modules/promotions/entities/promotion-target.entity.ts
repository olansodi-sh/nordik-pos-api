import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Promotion } from './promotion.entity';

export enum PromotionTargetType {
  CATEGORY = 'category',
  PRODUCT = 'product',
  VARIANT = 'variant',
}

@Entity('promotion_targets')
export class PromotionTarget {
  @PrimaryColumn({ name: 'promotionId', type: 'uuid' })
  promotionId: string;

  @ManyToOne(() => Promotion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotionId' })
  promotion: Promotion;

  @PrimaryColumn({
    name: 'targetType',
    type: 'enum',
    enum: PromotionTargetType,
  })
  targetType: PromotionTargetType;

  @PrimaryColumn({ name: 'targetId', type: 'uuid' })
  targetId: string;
}
