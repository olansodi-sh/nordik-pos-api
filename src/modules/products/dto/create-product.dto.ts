import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  sku: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  tracksInventory?: boolean;

  // Si no se envía, se genera uno interno.
  @IsOptional()
  @IsString()
  barcode?: string;

  // Valores de los campos personalizados definidos para Producto (ver
  // CustomFieldDefinition) — se validan contra esas definiciones al crear.
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
