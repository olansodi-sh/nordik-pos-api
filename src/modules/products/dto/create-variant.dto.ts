import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
}
