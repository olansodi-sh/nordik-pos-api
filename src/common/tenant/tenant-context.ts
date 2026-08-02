import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { AuthenticatedUser } from '../../modules/auth/types/jwt-payload.type';

/**
 * Provider request-scoped que expone el businessId del usuario autenticado.
 * Se puebla desde JwtStrategy (request.user) — es el único lugar del que
 * los servicios deben leer el tenant actual, para no depender de que cada
 * desarrollador se acuerde de pasarlo manualmente en cada query.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get businessId(): string {
    const user = this.request.user as AuthenticatedUser | undefined;
    if (!user?.businessId) {
      throw new UnauthorizedException(
        'No hay contexto de negocio en la petición',
      );
    }
    return user.businessId;
  }

  get currentUser(): AuthenticatedUser | undefined {
    return this.request.user as AuthenticatedUser | undefined;
  }
}
