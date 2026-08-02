import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { KitComponentsService } from './kit-components.service';
import { AddKitComponentDto } from './dto/add-kit-component.dto';

@Controller('products/:kitProductId/kit-components')
export class KitComponentsController {
  constructor(private readonly kitComponentsService: KitComponentsService) {}

  @RequirePermissions('catalog.read')
  @Get()
  findAll(@Param('kitProductId') kitProductId: string) {
    return this.kitComponentsService.findByKit(kitProductId);
  }

  @RequirePermissions('catalog.write')
  @Post()
  add(
    @Param('kitProductId') kitProductId: string,
    @Body() dto: AddKitComponentDto,
  ) {
    return this.kitComponentsService.add(kitProductId, dto);
  }

  @RequirePermissions('catalog.write')
  @Delete(':componentId')
  remove(
    @Param('kitProductId') kitProductId: string,
    @Param('componentId') componentId: string,
  ) {
    return this.kitComponentsService.remove(kitProductId, componentId);
  }
}
