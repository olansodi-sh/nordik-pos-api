import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../../common/tenant/tenant-context';
import { TenantScopedService } from '../../../common/tenant/tenant-scoped.service';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandsService extends TenantScopedService<Brand> {
  constructor(
    @InjectRepository(Brand) repository: Repository<Brand>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }
}
