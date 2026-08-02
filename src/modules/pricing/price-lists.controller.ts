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
import { PriceListsService } from './price-lists.service';
import { PriceListItemsService } from './price-list-items.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { SetPriceListItemDto } from './dto/set-price-list-item.dto';

@Controller('price-lists')
export class PriceListsController {
  constructor(
    private readonly priceListsService: PriceListsService,
    private readonly priceListItemsService: PriceListItemsService,
  ) {}

  @RequirePermissions('pricing.read')
  @Get()
  findAll() {
    return this.priceListsService.findAll();
  }

  @RequirePermissions('pricing.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceListsService.findOneOrFail(id);
  }

  @RequirePermissions('pricing.read')
  @Get(':id/items')
  findItems(@Param('id') id: string) {
    return this.priceListItemsService.findByList(id);
  }

  @RequirePermissions('pricing.write')
  @Post()
  create(
    @Body() dto: CreatePriceListDto,
    @Query('cloneFrom') cloneFrom?: string,
  ) {
    return cloneFrom
      ? this.priceListsService.clone(cloneFrom, dto.name)
      : this.priceListsService.create(dto);
  }

  @RequirePermissions('pricing.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreatePriceListDto) {
    return this.priceListsService.update(id, dto);
  }

  @RequirePermissions('pricing.write')
  @Post(':id/items')
  setItem(@Param('id') id: string, @Body() dto: SetPriceListItemDto) {
    return this.priceListItemsService.setPrice(id, dto);
  }

  @RequirePermissions('pricing.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.priceListsService.remove(id);
  }
}
