import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashSession } from './entities/cash-session.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { CashSessionsService } from './cash-sessions.service';
import { CashMovementsService } from './cash-movements.service';
import { CashSessionsController } from './cash-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CashSession, CashMovement])],
  controllers: [CashSessionsController],
  providers: [CashSessionsService, CashMovementsService],
  exports: [CashSessionsService, CashMovementsService, TypeOrmModule],
})
export class CashModule {}
