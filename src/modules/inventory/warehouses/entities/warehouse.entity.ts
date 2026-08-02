import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../../common/entities/tenant-base.entity';

@Entity('warehouses')
export class Warehouse extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ default: true })
  active: boolean;
}
