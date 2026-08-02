import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CashMovement,
  CashMovementType,
} from './entities/cash-movement.entity';
import { CashSession, CashSessionStatus } from './entities/cash-session.entity';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Injectable()
export class CashMovementsService {
  constructor(
    @InjectRepository(CashMovement)
    private readonly movementsRepository: Repository<CashMovement>,
    @InjectRepository(CashSession)
    private readonly sessionsRepository: Repository<CashSession>,
  ) {}

  async findBySession(sessionId: string): Promise<CashMovement[]> {
    return this.movementsRepository.find({ where: { sessionId } });
  }

  async create(
    sessionId: string,
    dto: CreateCashMovementDto,
  ): Promise<CashMovement> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session || session.status !== CashSessionStatus.OPEN) {
      throw new BadRequestException('La caja no existe o no está abierta');
    }

    return this.movementsRepository.save(
      this.movementsRepository.create({ sessionId, ...dto }),
    );
  }

  /** Usado internamente por pagos en efectivo para registrar el ingreso en caja. */
  async registerCashIn(
    sessionId: string,
    amount: number,
    concept: string,
    refType: string,
    refId: string,
  ) {
    return this.movementsRepository.save(
      this.movementsRepository.create({
        sessionId,
        type: CashMovementType.IN,
        amount,
        concept,
        refType,
        refId,
      }),
    );
  }
}
