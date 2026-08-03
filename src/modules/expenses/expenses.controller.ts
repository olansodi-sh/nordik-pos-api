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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @RequirePermissions('expenses.manage')
  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    return this.expensesService.findByRange(from, to);
  }

  @RequirePermissions('expenses.manage')
  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.expensesService.summary(from, to);
  }

  @RequirePermissions('expenses.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOneOrFail(id);
  }

  @RequirePermissions('expenses.manage')
  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.createExpense(dto);
  }

  @RequirePermissions('expenses.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @RequirePermissions('expenses.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
