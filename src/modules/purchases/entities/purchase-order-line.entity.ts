import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_order_lines')
export class PurchaseOrderLine extends BaseEntity {
  @Index()
  @Column({ name: 'orderId', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: PurchaseOrder;

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
