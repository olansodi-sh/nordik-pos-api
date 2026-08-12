import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CustomizableEntityType {
  SALE = 'sale',
  PRODUCT = 'product',
}

export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  SELECT = 'select',
}

/**
 * Catálogo de campos personalizados por inquilino (BD del inquilino — no
 * hace falta businessId, el aislamiento ya es físico). Los valores en sí se
 * guardan en la columna jsonb "customFields" de la entidad objetivo (ver
 * Sale.customFields, Product.customFields) — agregar un campo nuevo es solo
 * una fila aquí, sin tocar esquema.
 */
@Entity('custom_field_definitions')
@Unique('uq_custom_field_entity_key', ['entityType', 'key'])
export class CustomFieldDefinition extends BaseEntity {
  @Column({ name: 'entityType', type: 'enum', enum: CustomizableEntityType })
  entityType: CustomizableEntityType;

  @Column()
  key: string;

  @Column()
  label: string;

  @Column({ type: 'enum', enum: CustomFieldType })
  type: CustomFieldType;

  @Column({ default: false })
  required: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;

  @Column({ default: true })
  active: boolean;
}
