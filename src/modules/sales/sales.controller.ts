import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @RequirePermissions('sales.read')
  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @RequirePermissions('sales.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOneOrFail(id);
  }

  @RequirePermissions('sales.read')
  @Get(':id/lines')
  findLines(@Param('id') id: string) {
    return this.salesService.findLines(id);
  }

  @RequirePermissions('sales.write')
  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }
}
