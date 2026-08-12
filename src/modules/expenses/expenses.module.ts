import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Expense])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService, TenantOrmModule],
})
export class ExpensesModule {}
