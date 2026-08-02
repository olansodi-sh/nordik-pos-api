import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @RequirePermissions('purchases.read')
  @Get()
  findAll() {
    return this.purchaseOrdersService.findAll();
  }

  @RequirePermissions('purchases.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOneOrFail(id);
  }

  @RequirePermissions('purchases.read')
  @Get(':id/lines')
  findLines(@Param('id') id: string) {
    return this.purchaseOrdersService.findLines(id);
  }

  @RequirePermissions('purchases.write')
  @Post()
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.createOrder(dto);
  }

  @RequirePermissions('purchases.write')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.purchaseOrdersService.updateStatus(id, dto);
  }
}
