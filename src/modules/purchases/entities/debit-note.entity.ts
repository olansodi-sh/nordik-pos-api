import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('debit_notes')
export class DebitNote extends BaseEntity {
  @Column()
  number: string;

  @Column({ name: 'supplierId', type: 'uuid' })
  supplierId: string;

  @Column({ name: 'purchaseInvoiceId', type: 'uuid', nullable: true })
  purchaseInvoiceId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'date' })
  date: string;
}
