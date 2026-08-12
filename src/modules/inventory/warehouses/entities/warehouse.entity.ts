import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ default: true })
  active: boolean;
}
