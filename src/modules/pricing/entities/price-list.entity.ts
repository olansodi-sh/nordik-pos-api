import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

@Entity('price_lists')
export class PriceList extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ name: 'isDefault', default: false })
  isDefault: boolean;

  @Column({ default: true })
  active: boolean;
}
