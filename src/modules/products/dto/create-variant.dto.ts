import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { AttributeValueInputDto } from './attribute-value-input.dto';

export class CreateVariantDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  listPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  // Si no se envía, se genera uno interno.
  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueInputDto)
  attributes?: AttributeValueInputDto[];
}
