import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
}

export enum PromotionScope {
  ALL = 'all',
  CATEGORY = 'category',
  PRODUCT = 'product',
  VARIANT = 'variant',
}

export interface BuyXGetYConditions {
  buyQty: number;
  getQty: number;
}

@Entity('promotions')
export class Promotion extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ type: 'enum', enum: PromotionScope, default: PromotionScope.ALL })
  scope: PromotionScope;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  value: number | null;

  @Column({ type: 'jsonb', nullable: true })
  conditions: BuyXGetYConditions | null;

  @Column({ name: 'startDate', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'endDate', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ default: true })
  active: boolean;
}
