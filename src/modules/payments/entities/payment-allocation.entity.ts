import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Payment } from './payment.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('payment_allocations')
export class PaymentAllocation extends BaseEntity {
  @Index()
  @Column({ name: 'paymentId', type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Index()
  @Column({ name: 'saleId', type: 'uuid' })
  saleId: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;
}
