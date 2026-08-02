import { SetMetadata } from '@nestjs/common';
import { BasePermissionCode } from '../../modules/rbac/permissions.constants';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: BasePermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
