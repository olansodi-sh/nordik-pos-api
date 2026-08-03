import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { TenantContext } from '../../../common/tenant/tenant-context';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';

export interface RecordMovementParams {
  variantId?: string | null;
  productId?: string | null;
  warehouseId: string;
  quantityDelta: number;
  quantityAfter: number;
  type: StockMovementType;
  reason?: string | null;
  refType?: string | null;
  refId?: string | null;
  userId?: string | null;
  businessId: string;
}

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementsRepository: Repository<StockMovement>,
    private readonly tenantContext: TenantContext,
  ) {}

  /** Registra un movimiento; si se pasa `manager`, queda dentro de la misma transacción del caller. */
  async record(
    params: RecordMovementParams,
    manager?: EntityManager,
  ): Promise<StockMovement> {
    const repo = manager
      ? manager.getRepository(StockMovement)
      : this.movementsRepository;

    return repo.save(
      repo.create({
        ...params,
        variantId: params.variantId ?? null,
        productId: params.productId ?? null,
        reason: params.reason ?? null,
        refType: params.refType ?? null,
        refId: params.refId ?? null,
        userId: params.userId ?? null,
        date: new Date(),
      }),
    );
  }

  findAll(filters: {
    warehouseId?: string;
    variantId?: string;
    productId?: string;
    type?: StockMovementType;
    from?: string;
    to?: string;
  }): Promise<StockMovement[]> {
    const where: FindOptionsWhere<StockMovement> = {
      businessId: this.tenantContext.businessId,
    };
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.variantId) where.variantId = filters.variantId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.type) where.type = filters.type;
    if (filters.from && filters.to) {
      where.date = Between(new Date(filters.from), new Date(filters.to));
    } else if (filters.from) {
      where.date = MoreThanOrEqual(new Date(filters.from));
    } else if (filters.to) {
      where.date = LessThanOrEqual(new Date(filters.to));
    }

    return this.movementsRepository.find({
      where,
      order: { date: 'DESC' },
      take: 500,
    });
  }
}
