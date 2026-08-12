import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RecurringInvoiceFrequency } from '../entities/recurring-invoice.entity';

export class RecurringInvoiceLineInputDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateRecurringInvoiceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsUUID()
  warehouseId: string;

  @IsEnum(RecurringInvoiceFrequency)
  frequency: RecurringInvoiceFrequency;

  @IsDateString()
  nextRun: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringInvoiceLineInputDto)
  lines: RecurringInvoiceLineInputDto[];
}
