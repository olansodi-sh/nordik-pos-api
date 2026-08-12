import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreditNoteType } from '../entities/credit-note.entity';

export class RestockLineInputDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  warehouseId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateCreditNoteDto {
  @IsUUID()
  saleId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsEnum(CreditNoteType)
  type: CreditNoteType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  restock?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestockLineInputDto)
  restockLines?: RestockLineInputDto[];

  @IsOptional()
  @IsBoolean()
  generateVoucher?: boolean;
}
