import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @RequirePermissions('vouchers.manage')
  @Get()
  findAll() {
    return this.vouchersService.findAll();
  }

  @RequirePermissions('vouchers.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOneOrFail(id);
  }

  @RequirePermissions('vouchers.manage')
  @Get('by-code/:code')
  findByCode(@Param('code') code: string) {
    return this.vouchersService.findByCode(code);
  }

  @RequirePermissions('vouchers.manage')
  @Post()
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.createVoucher(dto);
  }

  @RequirePermissions('vouchers.manage')
  @Post(':id/redeem')
  redeem(@Param('id') id: string, @Body() dto: RedeemVoucherDto) {
    return this.vouchersService.redeem(id, dto);
  }
}
