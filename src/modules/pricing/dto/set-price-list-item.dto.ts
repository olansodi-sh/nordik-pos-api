import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class SetPriceListItemDto {
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
