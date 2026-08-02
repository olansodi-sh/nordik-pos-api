import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../../common/entities/tenant-base.entity';

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

@Entity('attribute_definitions')
export class AttributeDefinition extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: AttributeType, default: AttributeType.TEXT })
  type: AttributeType;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ name: 'isVariant', default: false })
  isVariant: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;
}
