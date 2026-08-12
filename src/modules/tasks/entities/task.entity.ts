import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TaskColumn } from './task-column.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class TaskItem extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Index()
  @Column({ name: 'columnId', type: 'uuid' })
  columnId: string;

  @ManyToOne(() => TaskColumn, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: TaskColumn;

  @Column({ name: 'assigneeId', type: 'uuid', nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User | null;

  @Column({ default: 0 })
  order: number;
}
