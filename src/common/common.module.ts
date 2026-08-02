import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenantContext } from './tenant/tenant-context';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  providers: [
    TenantContext,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [TenantContext],
})
export class CommonModule {}
