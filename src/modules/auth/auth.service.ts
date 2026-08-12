import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './types/jwt-payload.type';
import { MembershipsService } from '../memberships/memberships.service';
import { UserTenantMembership } from '../memberships/entities/user-tenant-membership.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const memberships = await this.membershipsService.findActiveForUser(user.id);

    if (memberships.length === 0) {
      throw new ForbiddenException('Este usuario no pertenece a ningún negocio activo');
    }

    if (memberships.length === 1) {
      return this.buildFullAuthResponse(user, memberships[0]);
    }

    // Más de una empresa activa: token "pre-auth" (identidad verificada, sin
    // negocio elegido todavía) — el frontend debe llamar a /auth/select-tenant.
    const preAuthToken = this.jwtService.sign({ sub: user.id } satisfies JwtPayload);
    return {
      accessToken: preAuthToken,
      requiresTenantSelection: true,
      memberships: memberships.map((m) => ({
        businessId: m.businessId,
        businessName: m.business?.name ?? m.businessId,
      })),
    };
  }

  /** Empresas del usuario actual — para el selector de negocio en la barra superior. */
  async myMemberships(userId: string) {
    const memberships = await this.membershipsService.findActiveForUser(userId);
    return memberships.map((m) => ({
      businessId: m.businessId,
      businessName: m.business?.name ?? m.businessId,
    }));
  }

  async selectTenant(userId: string, businessId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.active) {
      throw new UnauthorizedException();
    }

    const membership = await this.membershipsService.findActive(userId, businessId);
    if (!membership) {
      throw new ForbiddenException('No tienes acceso a ese negocio');
    }

    return this.buildFullAuthResponse(user, membership);
  }

  private async buildFullAuthResponse(user: User, membership: UserTenantMembership) {
    const payload: JwtPayload = {
      sub: user.id,
      businessId: membership.businessId,
      membershipId: membership.id,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: membership.businessId,
      },
    };
  }
}
