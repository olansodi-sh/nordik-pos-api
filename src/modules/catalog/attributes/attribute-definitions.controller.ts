import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { AttributeDefinitionsService } from './attribute-definitions.service';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';

@Controller('attribute-definitions')
export class AttributeDefinitionsController {
  constructor(
    private readonly attributeDefinitionsService: AttributeDefinitionsService,
  ) {}

  @RequirePermissions('catalog.read')
  @Get()
  findAll() {
    return this.attributeDefinitionsService.findAll();
  }

  @RequirePermissions('catalog.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributeDefinitionsService.findOneOrFail(id);
  }

  @RequirePermissions('catalog.write')
  @Post()
  create(@Body() dto: CreateAttributeDefinitionDto) {
    return this.attributeDefinitionsService.create(dto);
  }

  @RequirePermissions('catalog.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDefinitionDto) {
    return this.attributeDefinitionsService.update(id, dto);
  }

  @RequirePermissions('catalog.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attributeDefinitionsService.remove(id);
  }
}
