import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Role } from '../../rbac/entities/role.entity';

// El email es único globalmente (no por negocio): al iniciar sesión el
// usuario solo provee email/contraseña, sin elegir negocio explícitamente,
// así que no puede haber dos cuentas de empleado con el mismo email en
// negocios distintos.
@Entity('users')
export class User extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'passwordHash' })
  passwordHash: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({ name: 'roleId', type: 'uuid', nullable: true })
  roleId: string | null;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role: Role | null;
}
