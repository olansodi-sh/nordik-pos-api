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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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

  @RequirePermissions('users.manage')
  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('businessId') businessId?: string,
  ) {
    return this.usersService.findAllForBusiness(
      this.resolveBusinessId(currentUser, businessId),
    );
  }

  @RequirePermissions('users.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneForBusinessOrFail(
      this.tenantContext.businessId,
      id,
    );
  }

  @RequirePermissions('users.manage')
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.createForBusiness(
      this.resolveBusinessId(currentUser, dto.businessId),
      dto,
    );
  }

  @RequirePermissions('users.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateForBusiness(
      this.tenantContext.businessId,
      id,
      dto,
    );
  }

  @RequirePermissions('users.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.removeForBusiness(
      this.tenantContext.businessId,
      id,
    );
  }
}
