import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../../common/tenant/tenant-context';
import { TenantScopedService } from '../../../common/tenant/tenant-scoped.service';
import { AttributeDefinition } from './entities/attribute-definition.entity';

@Injectable()
export class AttributeDefinitionsService extends TenantScopedService<AttributeDefinition> {
  constructor(
    @InjectRepository(AttributeDefinition)
    repository: Repository<AttributeDefinition>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }
}
