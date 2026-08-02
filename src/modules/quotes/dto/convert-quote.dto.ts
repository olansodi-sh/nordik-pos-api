import { IsOptional, IsUUID } from 'class-validator';

export class ConvertQuoteDto {
  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  cashSessionId?: string;
}
