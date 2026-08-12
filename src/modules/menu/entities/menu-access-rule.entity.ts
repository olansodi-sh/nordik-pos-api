import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserTenantMembership } from '../../memberships/entities/user-tenant-membership.entity';
import { MenuItem } from './menu-item.entity';

export enum MenuAccessEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

/**
 * Regla de visibilidad de un ítem de menú para una membresía (usuario × en
 * este negocio), no para el usuario en bruto — así lo que alguien ve en la
 * empresa A puede configurarse independientemente de lo que ve en la B.
 * Independiente del sistema de Role/Permission (que decide qué ACCIONES
 * puede hacer, no qué pantallas ve).
 */
@Entity('menu_access_rules')
@Unique('uq_menu_access_membership_item', ['membershipId', 'menuItemId'])
export class MenuAccessRule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  membershipId: string;

  @ManyToOne(() => UserTenantMembership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membershipId' })
  membership: UserTenantMembership;

  @Column({ type: 'uuid' })
  menuItemId: string;

  @ManyToOne(() => MenuItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @Column({ type: 'enum', enum: MenuAccessEffect })
  effect: MenuAccessEffect;
}
