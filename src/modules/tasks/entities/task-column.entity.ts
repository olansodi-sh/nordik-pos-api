import { Column, Entity } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';

@Entity('task_columns')
export class TaskColumn extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ default: 0 })
  order: number;
}
