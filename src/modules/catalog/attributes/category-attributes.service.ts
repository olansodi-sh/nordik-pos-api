import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { AttributeDefinitionsService } from './attribute-definitions.service';
import { CategoryAttribute } from './entities/category-attribute.entity';

@Injectable()
export class CategoryAttributesService {
  constructor(
    @InjectRepository(CategoryAttribute)
    private readonly categoryAttributesRepository: Repository<CategoryAttribute>,
    private readonly categoriesService: CategoriesService,
    private readonly attributeDefinitionsService: AttributeDefinitionsService,
  ) {}

  async findByCategory(categoryId: string): Promise<CategoryAttribute[]> {
    // Verifica que la categoría pertenezca al negocio actual antes de listar.
    await this.categoriesService.findOneOrFail(categoryId);
    return this.categoryAttributesRepository.find({
      where: { categoryId, active: true },
      relations: { attributeDefinition: true },
    });
  }

  async assign(
    categoryId: string,
    attributeDefinitionId: string,
    required = false,
  ): Promise<CategoryAttribute> {
    await this.categoriesService.findOneOrFail(categoryId);
    await this.attributeDefinitionsService.findOneOrFail(attributeDefinitionId);

    const existing = await this.categoryAttributesRepository.findOne({
      where: { categoryId, attributeDefinitionId },
    });
    if (existing) {
      existing.active = true;
      existing.required = required;
      return this.categoryAttributesRepository.save(existing);
    }

    const link = this.categoryAttributesRepository.create({
      categoryId,
      attributeDefinitionId,
      required,
      active: true,
    });
    return this.categoryAttributesRepository.save(link);
  }

  async unassign(
    categoryId: string,
    attributeDefinitionId: string,
  ): Promise<void> {
    await this.categoriesService.findOneOrFail(categoryId);
    const existing = await this.categoryAttributesRepository.findOne({
      where: { categoryId, attributeDefinitionId },
    });
    if (!existing) {
      throw new NotFoundException('Atributo no asignado a esta categoría');
    }
    // Soft-disable: se conserva el histórico de valores ya capturados.
    existing.active = false;
    await this.categoryAttributesRepository.save(existing);
  }
}
