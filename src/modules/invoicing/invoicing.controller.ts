import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { BusinessInvoicingSettingsService } from './business-invoicing-settings.service';
import { SaleElectronicInvoicesService } from './sale-electronic-invoices.service';
import { UpdateInvoicingSettingsDto } from './dto/update-invoicing-settings.dto';

@Controller('invoicing')
export class InvoicingController {
  constructor(
    private readonly settingsService: BusinessInvoicingSettingsService,
    private readonly invoicesService: SaleElectronicInvoicesService,
  ) {}

  @RequirePermissions('invoicing.manage')
  @Get('settings')
  getSettings() {
    return this.settingsService.get();
  }

  @RequirePermissions('invoicing.manage')
  @Patch('settings')
  updateSettings(@Body() dto: UpdateInvoicingSettingsDto) {
    return this.settingsService.update(dto);
  }

  @RequirePermissions('invoicing.manage')
  @Get('sales/:saleId')
  findBySale(@Param('saleId') saleId: string) {
    return this.invoicesService.findBySale(saleId);
  }

  @RequirePermissions('invoicing.manage')
  @Post('sales/:saleId/emit')
  emit(@Param('saleId') saleId: string) {
    return this.invoicesService.emit(saleId);
  }
}
