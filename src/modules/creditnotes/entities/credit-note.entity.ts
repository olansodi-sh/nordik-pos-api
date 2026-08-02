import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

export enum CreditNoteType {
  PARTIAL = 'partial',
  TOTAL = 'total',
}

@Entity('credit_notes')
export class CreditNote extends TenantBaseEntity {
  @Column()
  number: string;

  @Column({ name: 'saleId', type: 'uuid' })
  saleId: string;

  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'enum', enum: CreditNoteType })
  type: CreditNoteType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ default: false })
  restock: boolean;

  @Column({ name: 'voucherId', type: 'uuid', nullable: true })
  voucherId: string | null;
}
