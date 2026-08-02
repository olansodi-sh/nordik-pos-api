import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { AttributeDefinition } from '../../catalog/attributes/entities/attribute-definition.entity';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @PrimaryColumn({ name: 'productId', type: 'uuid' })
  productId: string;

  @PrimaryColumn({ name: 'attributeDefinitionId', type: 'uuid' })
  attributeDefinitionId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => AttributeDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeDefinitionId' })
  attributeDefinition: AttributeDefinition;

  @Column()
  value: string;
}
