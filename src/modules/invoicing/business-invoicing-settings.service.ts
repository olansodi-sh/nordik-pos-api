import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { BusinessInvoicingSettings } from './entities/business-invoicing-settings.entity';
import { UpdateInvoicingSettingsDto } from './dto/update-invoicing-settings.dto';

@Injectable()
export class BusinessInvoicingSettingsService {
  constructor(
    @InjectRepository(BusinessInvoicingSettings)
    private readonly repository: Repository<BusinessInvoicingSettings>,
    private readonly tenantContext: TenantContext,
  ) {}

  async get(): Promise<BusinessInvoicingSettings> {
    const businessId = this.tenantContext.businessId;
    let settings = await this.repository.findOne({ where: { businessId } });
    if (!settings) {
      settings = await this.repository.save(
        this.repository.create({ businessId }),
      );
    }
    return settings;
  }

  async update(
    dto: UpdateInvoicingSettingsDto,
  ): Promise<BusinessInvoicingSettings> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.repository.save(settings);
  }
}
