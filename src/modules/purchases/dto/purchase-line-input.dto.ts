import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class PurchaseLineInputDto {
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}
