import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { CreditNote } from './entities/credit-note.entity';
import { CreditNotesService } from './credit-notes.service';
import { CreditNotesController } from './credit-notes.controller';
import { StockModule } from '../inventory/stock/stock.module';

@Module({
  imports: [TenantOrmModule.forFeature([CreditNote]), StockModule],
  controllers: [CreditNotesController],
  providers: [CreditNotesService],
  exports: [CreditNotesService, TenantOrmModule],
})
export class CreditNotesModule {}
