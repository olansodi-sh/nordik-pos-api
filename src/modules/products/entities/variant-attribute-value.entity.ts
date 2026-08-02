import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { AttributeDefinition } from '../../catalog/attributes/entities/attribute-definition.entity';

@Entity('variant_attribute_values')
export class VariantAttributeValue {
  @PrimaryColumn({ name: 'variantId', type: 'uuid' })
  variantId: string;

  @PrimaryColumn({ name: 'attributeDefinitionId', type: 'uuid' })
  attributeDefinitionId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @ManyToOne(() => AttributeDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeDefinitionId' })
  attributeDefinition: AttributeDefinition;

  @Column()
  value: string;
}
