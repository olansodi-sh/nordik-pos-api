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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantContext: TenantContext,
  ) {}

  @RequirePermissions('users.manage')
  @Get()
  findAll() {
    return this.usersService.findAllForBusiness(this.tenantContext.businessId);
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
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createForBusiness(
      this.tenantContext.businessId,
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
