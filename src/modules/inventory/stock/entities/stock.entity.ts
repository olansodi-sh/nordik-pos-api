import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { ProductVariant } from '../../../products/entities/product-variant.entity';
import { Product } from '../../../products/entities/product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

@Entity('stock')
@Check(
  'chk_stock_owner',
  `("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL)`,
)
@Index('uq_stock_variant_warehouse', ['variantId', 'warehouseId'], {
  unique: true,
})
@Index('uq_stock_product_warehouse', ['productId', 'warehouseId'], {
  unique: true,
})
export class Stock extends BaseEntity {
  @Index()
  @Column({ name: 'variantId', type: 'uuid', nullable: true })
  variantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @Index()
  @Column({ name: 'productId', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Index()
  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  quantity: number;
}
