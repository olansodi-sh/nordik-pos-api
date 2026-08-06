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
import { CashRegistersService } from './cash-registers.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';

@Controller('cash-registers')
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @RequirePermissions('cash.manage')
  @Get()
  findAll(@Query('warehouseId') warehouseId?: string) {
    return warehouseId
      ? this.cashRegistersService.findByWarehouse(warehouseId)
      : this.cashRegistersService.findAll();
  }

  @RequirePermissions('cash.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashRegistersService.findOneOrFail(id);
  }

  @RequirePermissions('cash.manage')
  @Post()
  create(@Body() dto: CreateCashRegisterDto) {
    return this.cashRegistersService.createRegister(dto);
  }

  @RequirePermissions('cash.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCashRegisterDto) {
    return this.cashRegistersService.update(id, dto);
  }

  @RequirePermissions('cash.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cashRegistersService.remove(id);
  }
}
