import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser, JwtPayload } from '../types/jwt-payload.type';
import { TenantConnectionManager } from '../../../database/tenant/tenant-connection-manager.service';
import { MembershipsService } from '../../memberships/memberships.service';
import { Role } from '../../rbac/entities/role.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException();
    }

    if (!payload.businessId) {
      // Token "pre-auth": identidad verificada, todavía sin negocio elegido
      // (usuario con más de una membresía activa). Válido solo para
      // /auth/select-tenant y /auth/me — cualquier ruta con TenantContext
      // rechaza la petición porque no hay businessId.
      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        permissions: [],
        isSuperAdmin: user.isSuperAdmin,
      };
    }

    const membership = await this.membershipsService.findActive(user.id, payload.businessId);
    if (!membership) {
      throw new UnauthorizedException();
    }

    let permissions: string[] = [];
    if (membership.roleId) {
      // Role vive en la BD física del inquilino (no en la central) — no hay
      // relación/FK posible entre las dos bases de datos, así que se
      // resuelve explícitamente contra la conexión del inquilino.
      const tenantDataSource = await this.tenantConnectionManager.getDataSourceForTenant(
        payload.businessId,
      );
      const role = await tenantDataSource
        .getRepository(Role)
        .findOne({ where: { id: membership.roleId } });
      permissions = role?.permissionCodes ?? [];
    }

    return {
      userId: user.id,
      businessId: payload.businessId,
      membershipId: membership.id,
      email: user.email,
      name: user.name,
      permissions,
      isSuperAdmin: user.isSuperAdmin,
    };
  }
}
