import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum LoyaltyTransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  ADJUSTMENT = 'adjustment',
  EXPIRED = 'expired',
}

@Entity('loyalty_point_transactions')
export class LoyaltyPointTransaction extends BaseEntity {
  @Column({ name: 'customerId', type: 'uuid' })
  customerId: string;

  @Column({ name: 'saleId', type: 'uuid', nullable: true })
  saleId: string | null;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'enum', enum: LoyaltyTransactionType })
  type: LoyaltyTransactionType;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz' })
  date: Date;
}
