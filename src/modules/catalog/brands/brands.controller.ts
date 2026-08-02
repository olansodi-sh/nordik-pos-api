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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @RequirePermissions('catalog.read')
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @RequirePermissions('catalog.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandsService.findOneOrFail(id);
  }

  @RequirePermissions('catalog.write')
  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @RequirePermissions('catalog.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @RequirePermissions('catalog.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
