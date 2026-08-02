import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltySettings } from './entities/loyalty-settings.entity';
import { LoyaltyPointTransaction } from './entities/loyalty-point-transaction.entity';
import { LoyaltySettingsService } from './loyalty-settings.service';
import { LoyaltyPointsService } from './loyalty-points.service';
import { LoyaltyController } from './loyalty.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoyaltySettings, LoyaltyPointTransaction]),
    CustomersModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltySettingsService, LoyaltyPointsService],
  exports: [LoyaltySettingsService, LoyaltyPointsService, TypeOrmModule],
})
export class LoyaltyModule {}
