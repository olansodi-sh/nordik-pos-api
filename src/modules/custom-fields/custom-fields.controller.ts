import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { CustomizableEntityType } from './entities/custom-field-definition.entity';

@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @RequirePermissions('business.manage')
  @Get()
  findAll(@Query('entityType') entityType?: CustomizableEntityType) {
    return this.customFieldsService.findAll(entityType);
  }

  @RequirePermissions('business.manage')
  @Post()
  create(@Body() dto: CreateCustomFieldDto) {
    return this.customFieldsService.create(dto);
  }

  @RequirePermissions('business.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    return this.customFieldsService.update(id, dto);
  }

  @RequirePermissions('business.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customFieldsService.remove(id);
  }
}
