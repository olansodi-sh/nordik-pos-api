import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDebitNoteDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  purchaseInvoiceId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
