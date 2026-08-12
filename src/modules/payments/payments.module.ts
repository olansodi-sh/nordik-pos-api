import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TenantOrmModule.forFeature([Payment, PaymentAllocation])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, TenantOrmModule],
})
export class PaymentsModule {}
