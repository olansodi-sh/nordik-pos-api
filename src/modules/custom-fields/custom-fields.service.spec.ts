import { BadRequestException } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import {
  CustomFieldDefinition,
  CustomFieldType,
  CustomizableEntityType,
} from './entities/custom-field-definition.entity';

function makeDefinition(partial: Partial<CustomFieldDefinition>): CustomFieldDefinition {
  return {
    id: partial.id ?? '1',
    entityType: CustomizableEntityType.SALE,
    key: partial.key ?? 'field',
    label: partial.label ?? 'Field',
    type: partial.type ?? CustomFieldType.TEXT,
    required: partial.required ?? false,
    options: partial.options ?? null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as CustomFieldDefinition;
}

function buildService(definitions: CustomFieldDefinition[]) {
  const repo = {
    find: jest.fn().mockResolvedValue(definitions),
  };
  return new CustomFieldsService(repo as never);
}

describe('CustomFieldsService.validate', () => {
  it('descarta claves sin definición en vez de guardarlas', async () => {
    const service = buildService([]);
    const result = await service.validate(CustomizableEntityType.SALE, { unknownField: 'x' });
    expect(result).toEqual({});
  });

  it('exige los campos requeridos', async () => {
    const service = buildService([
      makeDefinition({ key: 'note', label: 'Nota', required: true, type: CustomFieldType.TEXT }),
    ]);
    await expect(service.validate(CustomizableEntityType.SALE, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('acepta un campo requerido cuando viene presente', async () => {
    const service = buildService([
      makeDefinition({ key: 'note', label: 'Nota', required: true, type: CustomFieldType.TEXT }),
    ]);
    const result = await service.validate(CustomizableEntityType.SALE, { note: 'hola' });
    expect(result).toEqual({ note: 'hola' });
  });

  it('rechaza un valor numérico inválido', async () => {
    const service = buildService([
      makeDefinition({ key: 'qty', label: 'Cantidad', type: CustomFieldType.NUMBER }),
    ]);
    await expect(
      service.validate(CustomizableEntityType.SALE, { qty: 'no-es-numero' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza una opción fuera de la lista permitida en un campo select', async () => {
    const service = buildService([
      makeDefinition({
        key: 'size',
        label: 'Talla',
        type: CustomFieldType.SELECT,
        options: ['S', 'M', 'L'],
      }),
    ]);
    await expect(service.validate(CustomizableEntityType.SALE, { size: 'XL' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('acepta una opción válida en un campo select', async () => {
    const service = buildService([
      makeDefinition({
        key: 'size',
        label: 'Talla',
        type: CustomFieldType.SELECT,
        options: ['S', 'M', 'L'],
      }),
    ]);
    const result = await service.validate(CustomizableEntityType.SALE, { size: 'M' });
    expect(result).toEqual({ size: 'M' });
  });
});
