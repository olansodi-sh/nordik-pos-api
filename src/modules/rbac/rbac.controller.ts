import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext } from '../../common/tenant/tenant-context';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { RbacService } from './rbac.service';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller()
export class RbacController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly rolesService: RolesService,
    private readonly tenantContext: TenantContext,
  ) {}

  private resolveBusinessId(
    currentUser: AuthenticatedUser,
    requestedBusinessId?: string,
  ): string {
    if (currentUser.isSuperAdmin && requestedBusinessId) {
      return requestedBusinessId;
    }
    return this.tenantContext.businessId;
  }

  @RequirePermissions('roles.manage')
  @Get('permissions')
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @RequirePermissions('roles.manage')
  @Get('roles')
  findAllRoles(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('businessId') businessId?: string,
  ) {
    return this.rolesService.findRolesForBusiness(
      this.resolveBusinessId(currentUser, businessId),
    );
  }

  @RequirePermissions('roles.manage')
  @Get('roles/:id')
  findOneRole(@Param('id') id: string) {
    return this.rolesService.findRoleOrFail(this.tenantContext.businessId, id);
  }

  @RequirePermissions('roles.manage')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(this.tenantContext.businessId, dto);
  }

  @RequirePermissions('roles.manage')
  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(this.tenantContext.businessId, id, dto);
  }

  @RequirePermissions('roles.manage')
  @Delete('roles/:id')
  removeRole(@Param('id') id: string) {
    return this.rolesService.removeRole(this.tenantContext.businessId, id);
  }
}
