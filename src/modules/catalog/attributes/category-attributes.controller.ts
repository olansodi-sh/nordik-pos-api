import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CategoryAttributesService } from './category-attributes.service';
import { AssignCategoryAttributeDto } from './dto/assign-category-attribute.dto';

@Controller('categories/:categoryId/attributes')
export class CategoryAttributesController {
  constructor(
    private readonly categoryAttributesService: CategoryAttributesService,
  ) {}

  @RequirePermissions('catalog.read')
  @Get()
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.categoryAttributesService.findByCategory(categoryId);
  }

  @RequirePermissions('catalog.write')
  @Post()
  assign(
    @Param('categoryId') categoryId: string,
    @Body() dto: AssignCategoryAttributeDto,
  ) {
    return this.categoryAttributesService.assign(
      categoryId,
      dto.attributeDefinitionId,
      dto.required,
    );
  }

  @RequirePermissions('catalog.write')
  @Delete(':attributeDefinitionId')
  unassign(
    @Param('categoryId') categoryId: string,
    @Param('attributeDefinitionId') attributeDefinitionId: string,
  ) {
    return this.categoryAttributesService.unassign(
      categoryId,
      attributeDefinitionId,
    );
  }
}
