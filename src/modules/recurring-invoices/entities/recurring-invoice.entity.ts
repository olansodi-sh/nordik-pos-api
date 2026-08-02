import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

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
export class RecurringInvoice extends TenantBaseEntity {
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
