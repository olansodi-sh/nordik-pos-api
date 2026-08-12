import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  VOUCHER = 'voucher',
  CREDIT = 'credit',
  ONLINE_GATEWAY = 'online_gateway',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @Column({ name: 'cashSessionId', type: 'uuid', nullable: true })
  cashSessionId: string | null;

  @Column({ type: 'timestamptz' })
  date: Date;
}
