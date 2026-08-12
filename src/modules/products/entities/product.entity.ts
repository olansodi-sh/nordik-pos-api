import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from '../../catalog/categories/entities/category.entity';
import { Brand } from '../../catalog/brands/entities/brand.entity';

@Entity('products')
@Unique('uq_product_sku', ['sku'])
export class Product extends BaseEntity {
  @Column()
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ name: 'categoryId', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ name: 'brandId', type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @Column({ default: 'unidad' })
  unit: string;

  @Column({ name: 'tracksInventory', default: true })
  tracksInventory: boolean;

  @Column({ name: 'hasVariants', default: false })
  hasVariants: boolean;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: {} })
  customFields: Record<string, unknown>;
}
