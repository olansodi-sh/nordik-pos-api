import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Product } from '../../../products/entities/product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

@Entity('stock')
@Index('uq_stock_product_warehouse', ['productId', 'warehouseId'], {
  unique: true,
})
export class Stock extends BaseEntity {
  @Index()
  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Index()
  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  quantity: number;
}
