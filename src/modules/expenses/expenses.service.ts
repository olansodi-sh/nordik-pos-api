import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

interface CategoryTotalRow {
  category: string;
  total: string;
}

@Injectable()
export class ExpensesService extends TenantScopedService<Expense> {
  constructor(
    @InjectRepository(Expense) repository: Repository<Expense>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  findByRange(from?: string, to?: string): Promise<Expense[]> {
    if (from && to) {
      return this.findAll({ date: Between(from, to) });
    }
    if (from) {
      return this.findAll({ date: MoreThanOrEqual(from) });
    }
    if (to) {
      return this.findAll({ date: LessThanOrEqual(to) });
    }
    return this.findAll();
  }

  createExpense(dto: CreateExpenseDto): Promise<Expense> {
    return this.create({
      category: dto.category,
      description: dto.description ?? null,
      amount: dto.amount,
      date: dto.date ?? new Date().toISOString().slice(0, 10),
      userId: this.tenantContext.currentUser?.userId ?? null,
    });
  }

  async summary(
    from?: string,
    to?: string,
  ): Promise<{
    total: number;
    byCategory: { category: string; total: number }[];
  }> {
    const qb = this.repository
      .createQueryBuilder('expense')
      .where('expense."businessId" = :businessId', {
        businessId: this.tenantContext.businessId,
      });

    if (from) qb.andWhere('expense.date >= :from', { from });
    if (to) qb.andWhere('expense.date <= :to', { to });

    const rows = await qb
      .select('expense.category', 'category')
      .addSelect('SUM(expense.amount)', 'total')
      .groupBy('expense.category')
      .orderBy('"total"', 'DESC')
      .getRawMany<CategoryTotalRow>();

    const byCategory = rows.map((r) => ({
      category: r.category,
      total: Number(r.total),
    }));

    return {
      total: byCategory.reduce((sum, r) => sum + r.total, 0),
      byCategory,
    };
  }
}
