import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { TaskItem } from './entities/task.entity';
import { TaskColumnsService } from './task-columns.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService extends TenantScopedService<TaskItem> {
  constructor(
    @InjectRepository(TaskItem) repository: Repository<TaskItem>,
    private readonly taskColumnsService: TaskColumnsService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createTask(dto: CreateTaskDto): Promise<TaskItem> {
    await this.taskColumnsService.findOneOrFail(dto.columnId);
    return this.create(dto);
  }

  findByColumn(columnId: string) {
    return this.repository.find({
      where: { columnId },
      order: { order: 'ASC' },
    });
  }
}
