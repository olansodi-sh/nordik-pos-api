import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskColumn } from './entities/task-column.entity';
import { TaskItem } from './entities/task.entity';
import { TaskColumnsService } from './task-columns.service';
import { TaskColumnsController } from './task-columns.controller';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskColumn, TaskItem])],
  controllers: [TaskColumnsController, TasksController],
  providers: [TaskColumnsService, TasksService],
  exports: [TaskColumnsService, TasksService, TypeOrmModule],
})
export class TasksModule {}
