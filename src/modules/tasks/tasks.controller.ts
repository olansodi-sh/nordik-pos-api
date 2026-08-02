import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @RequirePermissions('tasks.manage')
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @RequirePermissions('tasks.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOneOrFail(id);
  }

  @RequirePermissions('tasks.manage')
  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
  }

  @RequirePermissions('tasks.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @RequirePermissions('tasks.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
