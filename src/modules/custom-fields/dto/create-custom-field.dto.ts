import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomFieldType, CustomizableEntityType } from '../entities/custom-field-definition.entity';

export class CreateCustomFieldDto {
  @IsEnum(CustomizableEntityType)
  entityType: CustomizableEntityType;

  @IsString()
  @MinLength(1)
  key: string;

  @IsString()
  @MinLength(1)
  label: string;

  @IsEnum(CustomFieldType)
  type: CustomFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}
