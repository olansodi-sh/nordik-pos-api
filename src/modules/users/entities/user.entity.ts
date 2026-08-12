import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

// El email es único globalmente: al iniciar sesión el usuario solo provee
// email/contraseña, sin elegir negocio explícitamente. Un usuario vive una
// sola vez en la BD central y puede tener membresías (UserTenantMembership)
// a varios negocios — por eso ya no tiene businessId/roleId propios, esos
// datos son por membresía, no por usuario.
@Entity('users')
export class User extends BaseEntity {
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
}
