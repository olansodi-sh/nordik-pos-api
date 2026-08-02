import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CashSessionsService } from './cash-sessions.service';
import { CashMovementsService } from './cash-movements.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Controller('cash-sessions')
export class CashSessionsController {
  constructor(
    private readonly cashSessionsService: CashSessionsService,
    private readonly cashMovementsService: CashMovementsService,
  ) {}

  @RequirePermissions('cash.manage')
  @Get()
  findAll() {
    return this.cashSessionsService.findAll();
  }

  @RequirePermissions('cash.manage')
  @Get('open')
  findOpen() {
    return this.cashSessionsService.findOpenForCurrentUser();
  }

  @RequirePermissions('cash.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashSessionsService.findOneOrFail(id);
  }

  @RequirePermissions('cash.manage')
  @Get(':id/movements')
  findMovements(@Param('id') id: string) {
    return this.cashMovementsService.findBySession(id);
  }

  @RequirePermissions('cash.manage')
  @Post('open')
  open(@Body() dto: OpenCashSessionDto) {
    return this.cashSessionsService.open(dto);
  }

  @RequirePermissions('cash.manage')
  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseCashSessionDto) {
    return this.cashSessionsService.close(id, dto);
  }

  @RequirePermissions('cash.manage')
  @Post(':id/movements')
  addMovement(@Param('id') id: string, @Body() dto: CreateCashMovementDto) {
    return this.cashMovementsService.create(id, dto);
  }
}
