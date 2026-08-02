import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { TaskColumn } from './entities/task-column.entity';

@Injectable()
export class TaskColumnsService extends TenantScopedService<TaskColumn> {
  constructor(
    @InjectRepository(TaskColumn) repository: Repository<TaskColumn>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }
}
