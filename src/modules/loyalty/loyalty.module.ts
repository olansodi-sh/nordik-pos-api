import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { LoyaltySettings } from './entities/loyalty-settings.entity';
import { LoyaltyPointTransaction } from './entities/loyalty-point-transaction.entity';
import { LoyaltySettingsService } from './loyalty-settings.service';
import { LoyaltyPointsService } from './loyalty-points.service';
import { LoyaltyController } from './loyalty.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([LoyaltySettings, LoyaltyPointTransaction]),
    CustomersModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltySettingsService, LoyaltyPointsService],
  exports: [LoyaltySettingsService, LoyaltyPointsService, TenantOrmModule],
})
export class LoyaltyModule {}
