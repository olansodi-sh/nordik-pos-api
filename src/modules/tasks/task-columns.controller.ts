import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TaskColumnsService } from './task-columns.service';
import { TasksService } from './tasks.service';
import { CreateTaskColumnDto } from './dto/create-task-column.dto';

@Controller('task-columns')
export class TaskColumnsController {
  constructor(
    private readonly taskColumnsService: TaskColumnsService,
    private readonly tasksService: TasksService,
  ) {}

  @RequirePermissions('tasks.manage')
  @Get()
  findAll() {
    return this.taskColumnsService.findAll();
  }

  @RequirePermissions('tasks.manage')
  @Get(':id/tasks')
  findTasks(@Param('id') id: string) {
    return this.tasksService.findByColumn(id);
  }

  @RequirePermissions('tasks.manage')
  @Post()
  create(@Body() dto: CreateTaskColumnDto) {
    return this.taskColumnsService.create(dto);
  }

  @RequirePermissions('tasks.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskColumnsService.remove(id);
  }
}
