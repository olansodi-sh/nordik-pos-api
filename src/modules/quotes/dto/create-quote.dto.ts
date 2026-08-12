import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuoteLineDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineDto)
  lines: CreateQuoteLineDto[];
}
