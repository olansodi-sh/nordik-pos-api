import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

export enum SalesChannel {
  POS = 'pos',
  ECOMMERCE = 'ecommerce',
}

export enum SaleStatus {
  CONFIRMED = 'confirmed',
  PARTIAL = 'partial',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('sales')
export class Sale extends TenantBaseEntity {
  @Column()
  number: string;

  @Column({ type: 'enum', enum: SalesChannel, default: SalesChannel.POS })
  channel: SalesChannel;

  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ name: 'priceListId', type: 'uuid', nullable: true })
  priceListId: string | null;

  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @Column({ name: 'cashSessionId', type: 'uuid', nullable: true })
  cashSessionId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({
    name: 'paidAmount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.CONFIRMED })
  status: SaleStatus;

  @Column({ type: 'timestamptz' })
  date: Date;
}
