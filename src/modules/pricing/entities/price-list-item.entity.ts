import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PriceList } from './price-list.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('price_list_items')
@Index('uq_price_list_product', ['priceListId', 'productId'], { unique: true })
export class PriceListItem extends BaseEntity {
  @Index()
  @Column({ name: 'priceListId', type: 'uuid' })
  priceListId: string;

  @ManyToOne(() => PriceList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'priceListId' })
  priceList: PriceList;

  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  price: number;
}
