import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @RequirePermissions('payments.write')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @RequirePermissions('payments.write')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOneOrFail(id);
  }

  @RequirePermissions('payments.write')
  @Get(':id/allocations')
  findAllocations(@Param('id') id: string) {
    return this.paymentsService.findAllocations(id);
  }

  @RequirePermissions('payments.write')
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }
}
