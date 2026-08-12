import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ApplyStockCountDto {
  @IsUUID()
  warehouseId: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0)
  countedQuantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
