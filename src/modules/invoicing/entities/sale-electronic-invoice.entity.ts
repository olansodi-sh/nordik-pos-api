import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum InvoicingStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ERROR = 'error',
}

@Entity('sale_electronic_invoices')
export class SaleElectronicInvoice extends BaseEntity {
  @Column({ name: 'saleId', type: 'uuid', unique: true })
  saleId: string;

  @Column()
  provider: string;

  @Column({ name: 'externalId', type: 'varchar', nullable: true })
  externalId: string | null;

  @Column({
    type: 'enum',
    enum: InvoicingStatus,
    default: InvoicingStatus.PENDING,
  })
  status: InvoicingStatus;

  @Column({ name: 'xmlUrl', type: 'varchar', nullable: true })
  xmlUrl: string | null;

  @Column({ name: 'pdfUrl', type: 'varchar', nullable: true })
  pdfUrl: string | null;

  @Column({ name: 'errorMessage', type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ default: 0 })
  attempts: number;
}
