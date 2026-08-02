import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../../common/entities/tenant-base.entity';

@Entity('brands')
export class Brand extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;
}
