import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('price_lists')
export class PriceList extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'isDefault', default: false })
  isDefault: boolean;

  @Column({ default: true })
  active: boolean;
}
