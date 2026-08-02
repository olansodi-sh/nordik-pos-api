import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('kit_components')
@Check(
  'chk_kit_component_owner',
  `("componentVariantId" IS NOT NULL AND "componentProductId" IS NULL) OR ("componentVariantId" IS NULL AND "componentProductId" IS NOT NULL)`,
)
export class KitComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kitProductId', type: 'uuid' })
  kitProductId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kitProductId' })
  kitProduct: Product;

  @Column({ name: 'componentVariantId', type: 'uuid', nullable: true })
  componentVariantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'componentVariantId' })
  componentVariant: ProductVariant | null;

  @Column({ name: 'componentProductId', type: 'uuid', nullable: true })
  componentProductId: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'componentProductId' })
  componentProduct: Product | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 1 })
  quantity: number;
}
