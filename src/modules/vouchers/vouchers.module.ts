import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Voucher } from './entities/voucher.entity';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Voucher])],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService, TenantOrmModule],
})
export class VouchersModule {}
