import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Sale } from './sale.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('sale_lines')
export class SaleLine extends BaseEntity {
  @Index()
  @Column({ name: 'saleId', type: 'uuid' })
  saleId: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: number;

  @Column({ name: 'unitPrice', type: 'numeric', precision: 14, scale: 2 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'promotionId', type: 'uuid', nullable: true })
  promotionId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;
}
