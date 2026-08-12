import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomFieldDefinition,
  CustomFieldType,
  CustomizableEntityType,
} from './entities/custom-field-definition.entity';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';

@Injectable()
export class CustomFieldsService {
  constructor(
    @InjectRepository(CustomFieldDefinition)
    private readonly repository: Repository<CustomFieldDefinition>,
  ) {}

  findForEntityType(entityType: CustomizableEntityType): Promise<CustomFieldDefinition[]> {
    return this.repository.find({ where: { entityType, active: true } });
  }

  findAll(entityType?: CustomizableEntityType): Promise<CustomFieldDefinition[]> {
    return this.repository.find({ where: entityType ? { entityType } : {} });
  }

  async findOneOrFail(id: string): Promise<CustomFieldDefinition> {
    const def = await this.repository.findOne({ where: { id } });
    if (!def) throw new NotFoundException(`Campo personalizado ${id} no encontrado`);
    return def;
  }

  create(dto: CreateCustomFieldDto): Promise<CustomFieldDefinition> {
    return this.repository.save(
      this.repository.create({ ...dto, required: dto.required ?? false, options: dto.options ?? null }),
    );
  }

  async update(id: string, dto: UpdateCustomFieldDto): Promise<CustomFieldDefinition> {
    const def = await this.findOneOrFail(id);
    Object.assign(def, dto);
    return this.repository.save(def);
  }

  async remove(id: string): Promise<void> {
    const def = await this.findOneOrFail(id);
    await this.repository.softRemove(def);
  }

  /**
   * Valida un payload de valores contra las definiciones activas de un tipo
   * de entidad: exige los requeridos, chequea tipos, y descarta cualquier
   * clave que no tenga definición (en vez de guardar campos con errores de
   * tipeo silenciosamente).
   */
  async validate(
    entityType: CustomizableEntityType,
    payload: Record<string, unknown> | undefined,
  ): Promise<Record<string, unknown>> {
    const definitions = await this.findForEntityType(entityType);
    const input = payload ?? {};
    const result: Record<string, unknown> = {};

    for (const def of definitions) {
      const value = input[def.key];

      if (value === undefined || value === null || value === '') {
        if (def.required) {
          throw new BadRequestException(`El campo "${def.label}" es obligatorio`);
        }
        continue;
      }

      result[def.key] = this.coerce(def, value);
    }

    return result;
  }

  private coerce(def: CustomFieldDefinition, value: unknown): unknown {
    switch (def.type) {
      case CustomFieldType.TEXT:
        if (typeof value !== 'string') {
          throw new BadRequestException(`El campo "${def.label}" debe ser texto`);
        }
        return value;
      case CustomFieldType.NUMBER: {
        const num = Number(value);
        if (Number.isNaN(num)) {
          throw new BadRequestException(`El campo "${def.label}" debe ser numérico`);
        }
        return num;
      }
      case CustomFieldType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`El campo "${def.label}" debe ser verdadero/falso`);
        }
        return value;
      case CustomFieldType.DATE:
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          throw new BadRequestException(`El campo "${def.label}" debe ser una fecha válida`);
        }
        return value;
      case CustomFieldType.SELECT:
        if (typeof value !== 'string' || !(def.options ?? []).includes(value)) {
          throw new BadRequestException(
            `El campo "${def.label}" debe ser una de las opciones permitidas`,
          );
        }
        return value;
      default:
        return value;
    }
  }
}
