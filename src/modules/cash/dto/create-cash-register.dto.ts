import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCashRegisterDto {
  @IsUUID()
  warehouseId: string;

  @IsString()
  @MinLength(1)
  name: string;
}
