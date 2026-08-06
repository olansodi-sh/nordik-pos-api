import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashSession } from './entities/cash-session.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { CashRegister } from './entities/cash-register.entity';
import { CashSessionsService } from './cash-sessions.service';
import { CashMovementsService } from './cash-movements.service';
import { CashRegistersService } from './cash-registers.service';
import { CashSessionsController } from './cash-sessions.controller';
import { CashRegistersController } from './cash-registers.controller';
import { WarehousesModule } from '../inventory/warehouses/warehouses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashSession, CashMovement, CashRegister]),
    WarehousesModule,
  ],
  controllers: [CashSessionsController, CashRegistersController],
  providers: [CashSessionsService, CashMovementsService, CashRegistersService],
  exports: [
    CashSessionsService,
    CashMovementsService,
    CashRegistersService,
    TypeOrmModule,
  ],
})
export class CashModule {}
