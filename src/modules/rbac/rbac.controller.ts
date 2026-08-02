import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantContext } from '../../common/tenant/tenant-context';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller()
export class RbacController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly tenantContext: TenantContext,
  ) {}

  @RequirePermissions('roles.manage')
  @Get('permissions')
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @RequirePermissions('roles.manage')
  @Get('roles')
  findAllRoles() {
    return this.rbacService.findRolesForBusiness(this.tenantContext.businessId);
  }

  @RequirePermissions('roles.manage')
  @Get('roles/:id')
  findOneRole(@Param('id') id: string) {
    return this.rbacService.findRoleOrFail(this.tenantContext.businessId, id);
  }

  @RequirePermissions('roles.manage')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(this.tenantContext.businessId, dto);
  }

  @RequirePermissions('roles.manage')
  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(this.tenantContext.businessId, id, dto);
  }

  @RequirePermissions('roles.manage')
  @Delete('roles/:id')
  removeRole(@Param('id') id: string) {
    return this.rbacService.removeRole(this.tenantContext.businessId, id);
  }
}
