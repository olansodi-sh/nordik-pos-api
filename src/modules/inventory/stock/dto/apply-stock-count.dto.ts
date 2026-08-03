import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ApplyStockCountDto {
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsNumber()
  @Min(0)
  countedQuantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
