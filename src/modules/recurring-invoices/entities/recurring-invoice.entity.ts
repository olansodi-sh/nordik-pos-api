import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RecurringInvoiceFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface RecurringInvoiceLine {
  variantId?: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
}

@Entity('recurring_invoices')
export class RecurringInvoice extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'enum', enum: RecurringInvoiceFrequency })
  frequency: RecurringInvoiceFrequency;

  @Column({ name: 'nextRun', type: 'date' })
  nextRun: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: [] })
  lines: RecurringInvoiceLine[];
}
