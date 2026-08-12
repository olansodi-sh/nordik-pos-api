import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  category: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'date' })
  date: string;
}
