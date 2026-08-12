import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('kit_components')
export class KitComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kitProductId', type: 'uuid' })
  kitProductId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kitProductId' })
  kitProduct: Product;

  @Column({ name: 'componentProductId', type: 'uuid' })
  componentProductId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'componentProductId' })
  componentProduct: Product;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 1 })
  quantity: number;
}
