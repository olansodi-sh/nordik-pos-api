import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('task_columns')
export class TaskColumn extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: 0 })
  order: number;
}
