import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { Sale } from '../sales/entities/sale.entity';
import { Stock } from '../inventory/stock/entities/stock.entity';

interface SalesSummaryRow {
  count: string;
  subtotal: string;
  discount: string;
  total: string;
}

interface TopCustomerRow {
  customerId: string;
  orderCount: string;
  totalSpent: string;
}

interface InventoryValuationRow {
  warehouseId: string;
  totalUnits: string;
  totalValue: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepository: Repository<Sale>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly tenantContext: TenantContext,
  ) {}

  async salesSummary(from?: string, to?: string) {
    const qb = this.salesRepository
      .createQueryBuilder('sale')
      .where('sale."businessId" = :businessId', {
        businessId: this.tenantContext.businessId,
      })
      .andWhere("sale.status != 'cancelled'");

    if (from) qb.andWhere('sale.date >= :from', { from });
    if (to) qb.andWhere('sale.date <= :to', { to });

    const { count, subtotal, discount, total } = await qb
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(sale.subtotal), 0)', 'subtotal')
      .addSelect('COALESCE(SUM(sale.discount), 0)', 'discount')
      .addSelect('COALESCE(SUM(sale.total), 0)', 'total')
      .getRawOne<SalesSummaryRow>()
      .then((row) => row as SalesSummaryRow);

    return {
      count: Number(count),
      subtotal: Number(subtotal),
      discount: Number(discount),
      total: Number(total),
    };
  }

  async topCustomers(from?: string, to?: string, limit = 10) {
    const qb = this.salesRepository
      .createQueryBuilder('sale')
      .where('sale."businessId" = :businessId', {
        businessId: this.tenantContext.businessId,
      })
      .andWhere('sale."customerId" IS NOT NULL')
      .andWhere("sale.status != 'cancelled'");

    if (from) qb.andWhere('sale.date >= :from', { from });
    if (to) qb.andWhere('sale.date <= :to', { to });

    return qb
      .select('sale."customerId"', 'customerId')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('SUM(sale.total)', 'totalSpent')
      .groupBy('sale."customerId"')
      .orderBy('"totalSpent"', 'DESC')
      .limit(limit)
      .getRawMany<TopCustomerRow>()
      .then((rows) =>
        rows.map((r) => ({
          customerId: r.customerId,
          orderCount: Number(r.orderCount),
          totalSpent: Number(r.totalSpent),
        })),
      );
  }

  /**
   * Valorización de inventario. Solo cubre stock de variantes (que tienen
   * `cost`); el stock de productos sin variantes no se incluye porque ese
   * modelo aún no tiene un campo de costo propio.
   */
  async inventoryValuation() {
    const rows = await this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.variant', 'variant')
      .innerJoin('variant.product', 'product')
      .where('product."businessId" = :businessId', {
        businessId: this.tenantContext.businessId,
      })
      .select('stock."warehouseId"', 'warehouseId')
      .addSelect('SUM(stock.quantity * variant.cost)', 'totalValue')
      .addSelect('SUM(stock.quantity)', 'totalUnits')
      .groupBy('stock."warehouseId"')
      .getRawMany<InventoryValuationRow>();

    return rows.map((r) => ({
      warehouseId: r.warehouseId,
      totalUnits: Number(r.totalUnits),
      totalValue: Number(r.totalValue),
    }));
  }
}
