import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../../common/tenant/tenant-context';
import { TenantScopedService } from '../../../common/tenant/tenant-scoped.service';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class WarehousesService extends TenantScopedService<Warehouse> {
  constructor(
    @InjectRepository(Warehouse) repository: Repository<Warehouse>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }
}
