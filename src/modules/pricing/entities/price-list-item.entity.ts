import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PriceList } from './price-list.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('price_list_items')
@Check(
  'chk_price_item_owner',
  `("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL)`,
)
@Index('uq_price_list_variant', ['priceListId', 'variantId'], { unique: true })
@Index('uq_price_list_product', ['priceListId', 'productId'], { unique: true })
export class PriceListItem extends BaseEntity {
  @Index()
  @Column({ name: 'priceListId', type: 'uuid' })
  priceListId: string;

  @ManyToOne(() => PriceList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'priceListId' })
  priceList: PriceList;

  @Column({ name: 'variantId', type: 'uuid', nullable: true })
  variantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @Column({ name: 'productId', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  price: number;
}
