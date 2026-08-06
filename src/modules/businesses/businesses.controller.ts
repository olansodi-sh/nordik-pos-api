import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext } from '../../common/tenant/tenant-context';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { BusinessesService } from './businesses.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CreateBusinessDto } from './dto/create-business.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly tenantContext: TenantContext,
  ) {}

  @UseGuards(SuperAdminGuard)
  @Get()
  findAll() {
    return this.businessesService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.businessesService.createFull(dto.name, dto.taxId, dto.admins);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessesService.remove(id);
  }

  @RequirePermissions('business.manage')
  @Get('me')
  findMe() {
    return this.businessesService.findById(this.tenantContext.businessId);
  }

  @RequirePermissions('business.manage')
  @Patch('me')
  updateMe(
    @Body() dto: UpdateBusinessDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const { name, taxId, ...rest } = dto;
    const allowedDto = currentUser.isSuperAdmin ? dto : rest;
    return this.businessesService.update(this.tenantContext.businessId, allowedDto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  updateAny(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(id, dto);
  }
}
