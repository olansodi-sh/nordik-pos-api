import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

export enum PurchaseInvoiceDocumentType {
  INVOICE = 'invoice',
  SUPPORT_DOCUMENT = 'support_document',
}

@Entity('purchase_invoices')
export class PurchaseInvoice extends TenantBaseEntity {
  @Column()
  number: string;

  @Column({
    name: 'documentType',
    type: 'enum',
    enum: PurchaseInvoiceDocumentType,
  })
  documentType: PurchaseInvoiceDocumentType;

  @Column({ name: 'supplierId', type: 'uuid' })
  supplierId: string;

  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @Column({ name: 'purchaseOrderId', type: 'uuid', nullable: true })
  purchaseOrderId: string | null;

  @Column({ name: 'supplierDocNumber', type: 'varchar', nullable: true })
  supplierDocNumber: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'date' })
  date: string;
}
