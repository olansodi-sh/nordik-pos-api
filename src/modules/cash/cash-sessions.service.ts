import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { CashSession, CashSessionStatus } from './entities/cash-session.entity';
import {
  CashMovement,
  CashMovementType,
} from './entities/cash-movement.entity';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';

@Injectable()
export class CashSessionsService extends TenantScopedService<CashSession> {
  constructor(
    @InjectRepository(CashSession) repository: Repository<CashSession>,
    @InjectRepository(CashMovement)
    private readonly movementsRepository: Repository<CashMovement>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async open(dto: OpenCashSessionDto): Promise<CashSession> {
    const userId = this.tenantContext.currentUser?.userId;
    if (!userId) {
      throw new BadRequestException('No hay usuario autenticado');
    }

    const existingOpen = await this.repository.findOne({
      where: {
        businessId: this.tenantContext.businessId,
        userId,
        status: CashSessionStatus.OPEN,
      },
    });
    if (existingOpen) {
      throw new BadRequestException('Ya tienes una caja abierta');
    }

    return this.create({
      userId,
      warehouseId: dto.warehouseId ?? null,
      openingAmount: dto.openingAmount,
      status: CashSessionStatus.OPEN,
      openedAt: new Date(),
    });
  }

  async close(id: string, dto: CloseCashSessionDto): Promise<CashSession> {
    const session = await this.findOneOrFail(id);
    if (session.status === CashSessionStatus.CLOSED) {
      throw new BadRequestException('Esta caja ya está cerrada');
    }

    const movements = await this.movementsRepository.find({
      where: { sessionId: id },
    });
    const totalIn = movements
      .filter((m) => m.type === CashMovementType.IN)
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const totalOut = movements
      .filter((m) => m.type === CashMovementType.OUT)
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expectedAmount = Number(session.openingAmount) + totalIn - totalOut;
    const difference = dto.countedAmount - expectedAmount;

    return this.update(id, {
      countedAmount: dto.countedAmount,
      expectedAmount,
      difference,
      status: CashSessionStatus.CLOSED,
      closedAt: new Date(),
    });
  }

  findOpenForCurrentUser(): Promise<CashSession | null> {
    const userId = this.tenantContext.currentUser?.userId;
    return this.repository.findOne({
      where: {
        businessId: this.tenantContext.businessId,
        userId,
        status: CashSessionStatus.OPEN,
      },
    });
  }
}
