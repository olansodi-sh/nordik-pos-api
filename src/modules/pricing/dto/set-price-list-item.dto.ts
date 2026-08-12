import { IsNumber, IsUUID, Min } from 'class-validator';

export class SetPriceListItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0)
  price: number;
}
