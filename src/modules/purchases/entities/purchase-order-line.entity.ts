import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_order_lines')
@Check(
  'chk_po_line_owner',
  `("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL)`,
)
export class PurchaseOrderLine extends BaseEntity {
  @Index()
  @Column({ name: 'orderId', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: PurchaseOrder;

  @Column({ name: 'variantId', type: 'uuid', nullable: true })
  variantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @Column({ name: 'productId', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column()
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: number;

  @Column({ name: 'unitCost', type: 'numeric', precision: 14, scale: 2 })
  unitCost: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;
}
