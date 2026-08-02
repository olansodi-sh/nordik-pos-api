import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('businesses')
export class Business extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'taxId', type: 'varchar', nullable: true })
  taxId: string | null;

  @Column({ default: true })
  active: boolean;
}
