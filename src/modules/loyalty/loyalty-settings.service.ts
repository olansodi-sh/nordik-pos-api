import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { LoyaltySettings } from './entities/loyalty-settings.entity';
import { UpdateLoyaltySettingsDto } from './dto/update-loyalty-settings.dto';

@Injectable()
export class LoyaltySettingsService {
  constructor(
    @InjectRepository(LoyaltySettings)
    private readonly repository: Repository<LoyaltySettings>,
    private readonly tenantContext: TenantContext,
  ) {}

  async get(): Promise<LoyaltySettings> {
    const businessId = this.tenantContext.businessId;
    let settings = await this.repository.findOne({ where: { businessId } });
    if (!settings) {
      settings = await this.repository.save(
        this.repository.create({ businessId }),
      );
    }
    return settings;
  }

  async update(dto: UpdateLoyaltySettingsDto): Promise<LoyaltySettings> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.repository.save(settings);
  }
}
