import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantContext } from '../../common/tenant/tenant-context';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
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
    return this.businessesService.createFull(dto.name, dto.taxId);
  }

  @RequirePermissions('business.manage')
  @Get('me')
  findMe() {
    return this.businessesService.findById(this.tenantContext.businessId);
  }

  @RequirePermissions('business.manage')
  @Patch('me')
  updateMe(@Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(this.tenantContext.businessId, dto);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  updateAny(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(id, dto);
  }
}
