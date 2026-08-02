import { Column, Entity, JoinTable, ManyToMany, Unique } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Permission } from './permission.entity';

@Entity('roles')
@Unique('uq_role_business_name', ['businessId', 'name'])
export class Role extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'rolesId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionsId', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
