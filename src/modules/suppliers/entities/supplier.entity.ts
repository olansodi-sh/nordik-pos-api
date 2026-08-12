import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DocType } from '../../customers/entities/customer.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: DocType, nullable: true })
  docType: DocType | null;

  @Column({ name: 'docNumber', type: 'varchar', nullable: true })
  docNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ default: true })
  active: boolean;
}
