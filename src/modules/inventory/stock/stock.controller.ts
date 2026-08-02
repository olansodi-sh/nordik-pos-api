import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @RequirePermissions('inventory.read')
  @Get()
  findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.stockService.findAll({ warehouseId, variantId, productId });
  }

  @RequirePermissions('inventory.write')
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto) {
    return this.stockService.adjust(dto);
  }
}
