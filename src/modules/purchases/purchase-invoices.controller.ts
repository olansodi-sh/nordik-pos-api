import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';

@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(
    private readonly purchaseInvoicesService: PurchaseInvoicesService,
  ) {}

  @RequirePermissions('purchases.read')
  @Get()
  findAll() {
    return this.purchaseInvoicesService.findAll();
  }

  @RequirePermissions('purchases.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseInvoicesService.findOneOrFail(id);
  }

  @RequirePermissions('purchases.read')
  @Get(':id/lines')
  findLines(@Param('id') id: string) {
    return this.purchaseInvoicesService.findLines(id);
  }

  @RequirePermissions('purchases.write')
  @Post()
  create(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchaseInvoicesService.createInvoice(dto);
  }
}
