import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { LoyaltySettingsService } from './loyalty-settings.service';
import { LoyaltyPointsService } from './loyalty-points.service';
import { UpdateLoyaltySettingsDto } from './dto/update-loyalty-settings.dto';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyaltySettingsService: LoyaltySettingsService,
    private readonly loyaltyPointsService: LoyaltyPointsService,
  ) {}

  @RequirePermissions('loyalty.manage')
  @Get('settings')
  getSettings() {
    return this.loyaltySettingsService.get();
  }

  @RequirePermissions('loyalty.manage')
  @Patch('settings')
  updateSettings(@Body() dto: UpdateLoyaltySettingsDto) {
    return this.loyaltySettingsService.update(dto);
  }

  @RequirePermissions('loyalty.manage')
  @Get('customers/:customerId/transactions')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.loyaltyPointsService.findByCustomer(customerId);
  }

  @RequirePermissions('loyalty.manage')
  @Post('adjust')
  adjust(@Body() dto: AdjustLoyaltyPointsDto) {
    return this.loyaltyPointsService.adjust(dto);
  }
}
