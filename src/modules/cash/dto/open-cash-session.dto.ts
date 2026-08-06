import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class OpenCashSessionDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  cashRegisterId?: string;

  @IsNumber()
  @Min(0)
  openingAmount: number;
}
