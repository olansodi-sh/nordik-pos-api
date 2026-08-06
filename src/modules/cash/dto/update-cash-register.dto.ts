import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCashRegisterDto } from './create-cash-register.dto';

export class UpdateCashRegisterDto extends PartialType(CreateCashRegisterDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
