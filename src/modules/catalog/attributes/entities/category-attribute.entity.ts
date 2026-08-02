import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { AttributeDefinition } from './attribute-definition.entity';

@Entity('category_attributes')
export class CategoryAttribute {
  @PrimaryColumn({ name: 'categoryId', type: 'uuid' })
  categoryId: string;

  @PrimaryColumn({ name: 'attributeDefinitionId', type: 'uuid' })
  attributeDefinitionId: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => AttributeDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeDefinitionId' })
  attributeDefinition: AttributeDefinition;

  @Column({ default: false })
  required: boolean;

  @Column({ default: true })
  active: boolean;
}
