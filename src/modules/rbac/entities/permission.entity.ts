import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;
}
