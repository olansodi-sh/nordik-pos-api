import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import {
  LoyaltyPointTransaction,
  LoyaltyTransactionType,
} from './entities/loyalty-point-transaction.entity';
import { LoyaltySettingsService } from './loyalty-settings.service';
import { CustomersService } from '../customers/customers.service';
import { AdjustLoyaltyPointsDto } from './dto/adjust-loyalty-points.dto';

@Injectable()
export class LoyaltyPointsService {
  constructor(
    @InjectRepository(LoyaltyPointTransaction)
    private readonly transactionsRepository: Repository<LoyaltyPointTransaction>,
    private readonly loyaltySettingsService: LoyaltySettingsService,
    private readonly customersService: CustomersService,
    private readonly tenantContext: TenantContext,
  ) {}

  findByCustomer(customerId: string): Promise<LoyaltyPointTransaction[]> {
    return this.transactionsRepository.find({ where: { customerId } });
  }

  /** Se llama tras confirmar una venta con cliente asociado. No falla la venta si algo sale mal. */
  async awardForSale(
    customerId: string,
    saleId: string,
    saleTotal: number,
  ): Promise<void> {
    const settings = await this.loyaltySettingsService.get();
    if (!settings.enabled || Number(settings.pointsPerAmount) <= 0) {
      return;
    }

    const units = Math.floor(saleTotal / Number(settings.amountUnit));
    const points = units * Number(settings.pointsPerAmount);
    if (points <= 0) return;

    await this.registerTransaction(
      customerId,
      points,
      LoyaltyTransactionType.EARNED,
      `Venta ${saleId}`,
      saleId,
    );
  }

  async adjust(dto: AdjustLoyaltyPointsDto): Promise<LoyaltyPointTransaction> {
    return this.registerTransaction(
      dto.customerId,
      dto.points,
      LoyaltyTransactionType.ADJUSTMENT,
      dto.description ?? 'Ajuste manual',
    );
  }

  private async registerTransaction(
    customerId: string,
    points: number,
    type: LoyaltyTransactionType,
    description: string,
    saleId?: string,
  ): Promise<LoyaltyPointTransaction> {
    const customer = await this.customersService.findOneOrFail(customerId);

    const transaction = await this.transactionsRepository.save(
      this.transactionsRepository.create({
        customerId,
        saleId: saleId ?? null,
        points,
        type,
        description,
        date: new Date(),
      }),
    );

    await this.customersService.update(customerId, {
      loyaltyPoints: customer.loyaltyPoints + points,
    });

    return transaction;
  }
}
