import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @RequirePermissions('inventory.read')
  @Get()
  findAll() {
    return this.warehousesService.findAll();
  }

  @RequirePermissions('inventory.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOneOrFail(id);
  }

  @RequirePermissions('inventory.write')
  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @RequirePermissions('inventory.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @RequirePermissions('inventory.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
