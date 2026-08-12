import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum VoucherStatus {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

@Entity('vouchers')
export class Voucher extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  balance: number;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  status: VoucherStatus;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ name: 'expiresAt', type: 'date', nullable: true })
  expiresAt: string | null;
}
