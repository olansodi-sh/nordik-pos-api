import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from '../../inventory/warehouses/entities/warehouse.entity';
import { CashRegister } from './cash-register.entity';

export enum CashSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('cash_sessions')
export class CashSession extends TenantBaseEntity {
  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'warehouseId', type: 'uuid', nullable: true })
  warehouseId: string | null;

  @ManyToOne(() => Warehouse, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse | null;

  @Column({ name: 'cashRegisterId', type: 'uuid', nullable: true })
  cashRegisterId: string | null;

  @ManyToOne(() => CashRegister, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashRegisterId' })
  cashRegister: CashRegister | null;

  @Column({
    name: 'openingAmount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  openingAmount: number;

  @Column({
    name: 'countedAmount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  countedAmount: number | null;

  @Column({
    name: 'expectedAmount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  expectedAmount: number | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  difference: number | null;

  @Column({
    type: 'enum',
    enum: CashSessionStatus,
    default: CashSessionStatus.OPEN,
  })
  status: CashSessionStatus;

  @Column({ name: 'openedAt', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closedAt', type: 'timestamptz', nullable: true })
  closedAt: Date | null;
}
