import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @Index()
  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  cost: number;

  @Column({
    name: 'listPrice',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  listPrice: number | null;

  @Column({
    name: 'discountPercent',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercent: number;

  @Column({ default: true })
  active: boolean;
}
