import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @RequirePermissions('reports.read')
  @Get('sales-summary')
  salesSummary(@Query() dto: DateRangeDto) {
    return this.reportsService.salesSummary(dto.from, dto.to);
  }

  @RequirePermissions('reports.read')
  @Get('top-customers')
  topCustomers(@Query() dto: DateRangeDto, @Query('limit') limit?: string) {
    return this.reportsService.topCustomers(
      dto.from,
      dto.to,
      limit ? Number(limit) : undefined,
    );
  }

  @RequirePermissions('reports.read')
  @Get('inventory-valuation')
  inventoryValuation() {
    return this.reportsService.inventoryValuation();
  }
}
