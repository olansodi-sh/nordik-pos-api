import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CashSession } from './cash-session.entity';

export enum CashMovementType {
  IN = 'in',
  OUT = 'out',
}

@Entity('cash_movements')
export class CashMovement extends BaseEntity {
  @Index()
  @Column({ name: 'sessionId', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => CashSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: CashSession;

  @Column({ type: 'enum', enum: CashMovementType })
  type: CashMovementType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column()
  concept: string;

  @Column({ name: 'refType', type: 'varchar', nullable: true })
  refType: string | null;

  @Column({ name: 'refId', type: 'uuid', nullable: true })
  refId: string | null;
}
