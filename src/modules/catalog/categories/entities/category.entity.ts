import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from '../../../../common/entities/tenant-base.entity';

@Entity('categories')
export class Category extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ name: 'parentId', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;
}
