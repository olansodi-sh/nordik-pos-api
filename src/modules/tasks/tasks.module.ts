import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { TaskColumn } from './entities/task-column.entity';
import { TaskItem } from './entities/task.entity';
import { TaskColumnsService } from './task-columns.service';
import { TaskColumnsController } from './task-columns.controller';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TenantOrmModule.forFeature([TaskColumn, TaskItem])],
  controllers: [TaskColumnsController, TasksController],
  providers: [TaskColumnsService, TasksService],
  exports: [TaskColumnsService, TasksService, TenantOrmModule],
})
export class TasksModule {}
