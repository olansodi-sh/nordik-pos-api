import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_invoice_lines')
export class PurchaseInvoiceLine extends BaseEntity {
  @Index()
  @Column({ name: 'invoiceId', type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => PurchaseInvoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: PurchaseInvoice;

  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: number;

  @Column({ name: 'unitCost', type: 'numeric', precision: 14, scale: 2 })
  unitCost: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;
}
