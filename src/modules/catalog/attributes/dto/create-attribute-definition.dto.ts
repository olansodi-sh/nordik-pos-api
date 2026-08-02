import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AttributeType } from '../entities/attribute-definition.entity';

export class CreateAttributeDefinitionDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(AttributeType)
  type: AttributeType;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isVariant?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}
