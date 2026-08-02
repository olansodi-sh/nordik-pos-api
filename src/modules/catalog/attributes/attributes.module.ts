import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { CategoryAttribute } from './entities/category-attribute.entity';
import { AttributeDefinitionsService } from './attribute-definitions.service';
import { AttributeDefinitionsController } from './attribute-definitions.controller';
import { CategoryAttributesService } from './category-attributes.service';
import { CategoryAttributesController } from './category-attributes.controller';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttributeDefinition, CategoryAttribute]),
    CategoriesModule,
  ],
  controllers: [AttributeDefinitionsController, CategoryAttributesController],
  providers: [AttributeDefinitionsService, CategoryAttributesService],
  exports: [AttributeDefinitionsService, TypeOrmModule],
})
export class AttributesModule {}
