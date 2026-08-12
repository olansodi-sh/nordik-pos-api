import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';

export enum MembershipStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

/**
 * Relación usuario-empresa (BD central): un usuario puede tener una
 * membresía activa por negocio, con su propio rol por negocio — roleId no
 * tiene FK porque Role vive en la base de datos física de cada inquilino,
 * no en la central junto a esta tabla.
 */
@Entity('user_tenant_memberships')
@Unique('uq_membership_user_business', ['userId', 'businessId'])
export class UserTenantMembership extends BaseEntity {
  @Index()
  @Column({ name: 'userId', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ name: 'businessId', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ name: 'roleId', type: 'uuid', nullable: true })
  roleId: string | null;

  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @Column({ name: 'isDefault', default: false })
  isDefault: boolean;
}
