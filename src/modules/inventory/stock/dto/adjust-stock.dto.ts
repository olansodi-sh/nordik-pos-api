import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';

export enum StockAdjustMode {
  SET = 'set',
  ADD = 'add',
}

export class AdjustStockDto {
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsNumber()
  quantity: number;

  @IsEnum(StockAdjustMode)
  mode: StockAdjustMode;
}
