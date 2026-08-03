import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { StockService } from './stock.service';
import { StockMovementsService } from './stock-movements.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { ApplyStockCountDto } from './dto/apply-stock-count.dto';
import { StockMovementType } from './entities/stock-movement.entity';

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  @RequirePermissions('inventory.read')
  @Get()
  findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.stockService.findAll({ warehouseId, variantId, productId });
  }

  @RequirePermissions('inventory.read')
  @Get('movements')
  findMovements(
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
    @Query('productId') productId?: string,
    @Query('type') type?: StockMovementType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.stockMovementsService.findAll({
      warehouseId,
      variantId,
      productId,
      type,
      from,
      to,
    });
  }

  @RequirePermissions('inventory.write')
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto) {
    return this.stockService.adjust(dto);
  }

  @RequirePermissions('inventory.write')
  @Post('count')
  applyCount(@Body() dto: ApplyStockCountDto) {
    return this.stockService.applyCount(dto);
  }
}
