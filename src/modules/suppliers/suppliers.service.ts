import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService extends TenantScopedService<Supplier> {
  constructor(
    @InjectRepository(Supplier) repository: Repository<Supplier>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }
}
