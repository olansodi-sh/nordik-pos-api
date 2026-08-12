import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED = 'converted',
}

@Entity('quotes')
export class Quote extends BaseEntity {
  @Column()
  number: string;

  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Column({ name: 'validUntil', type: 'date', nullable: true })
  validUntil: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'saleId', type: 'uuid', nullable: true })
  saleId: string | null;
}
