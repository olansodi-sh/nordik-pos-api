import { IsString, MinLength } from 'class-validator';

export class VoidSaleDto {
  @IsString()
  @MinLength(1)
  reason: string;
}
