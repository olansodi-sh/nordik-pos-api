import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../../common/tenant/tenant-context';
import { TenantScopedService } from '../../../common/tenant/tenant-scoped.service';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService extends TenantScopedService<Category> {
  constructor(
    @InjectRepository(Category) repository: Repository<Category>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }
}
