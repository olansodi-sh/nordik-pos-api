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
import { RecurringInvoicesService } from './recurring-invoices.service';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';

@Controller('recurring-invoices')
export class RecurringInvoicesController {
  constructor(
    private readonly recurringInvoicesService: RecurringInvoicesService,
  ) {}

  @RequirePermissions('recurring.manage')
  @Get()
  findAll() {
    return this.recurringInvoicesService.findAll();
  }

  @RequirePermissions('recurring.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recurringInvoicesService.findOneOrFail(id);
  }

  @RequirePermissions('recurring.manage')
  @Post()
  create(@Body() dto: CreateRecurringInvoiceDto) {
    return this.recurringInvoicesService.create(dto);
  }

  @RequirePermissions('recurring.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecurringInvoiceDto) {
    return this.recurringInvoicesService.update(id, dto);
  }

  @RequirePermissions('recurring.manage')
  @Post(':id/advance')
  advance(@Param('id') id: string) {
    return this.recurringInvoicesService.advanceNextRun(id);
  }

  @RequirePermissions('recurring.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recurringInvoicesService.remove(id);
  }
}
