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
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @RequirePermissions('pricing.read')
  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @RequirePermissions('pricing.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOneOrFail(id);
  }

  @RequirePermissions('pricing.read')
  @Get(':id/targets')
  findTargets(@Param('id') id: string) {
    return this.promotionsService.findTargets(id);
  }

  @RequirePermissions('pricing.write')
  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.createPromotion(dto);
  }

  @RequirePermissions('pricing.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.updatePromotion(id, dto);
  }

  @RequirePermissions('pricing.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
