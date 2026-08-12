import { IsEnum, IsNumber, IsUUID } from 'class-validator';

export enum StockAdjustMode {
  SET = 'set',
  ADD = 'add',
}

export class AdjustStockDto {
  @IsUUID()
  warehouseId: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(StockAdjustMode)
  mode: StockAdjustMode;
}
