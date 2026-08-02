import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('quote_lines')
@Check(
  'chk_quote_line_owner',
  `("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL)`,
)
export class QuoteLine extends BaseEntity {
  @Index()
  @Column({ name: 'quoteId', type: 'uuid' })
  quoteId: string;

  @ManyToOne(() => Quote, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

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

  @Column({ name: 'unitPrice', type: 'numeric', precision: 14, scale: 2 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;
}
