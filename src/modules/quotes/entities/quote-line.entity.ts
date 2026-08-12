import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('quote_lines')
export class QuoteLine extends BaseEntity {
  @Index()
  @Column({ name: 'quoteId', type: 'uuid' })
  quoteId: string;

  @ManyToOne(() => Quote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

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

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;
}
