import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Quote } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [TenantOrmModule.forFeature([Quote, QuoteLine]), SalesModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService, TenantOrmModule],
})
export class QuotesModule {}
