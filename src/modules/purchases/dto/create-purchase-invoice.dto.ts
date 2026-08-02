import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PurchaseInvoiceDocumentType } from '../entities/purchase-invoice.entity';
import { PurchaseLineInputDto } from './purchase-line-input.dto';

export class CreatePurchaseInvoiceDto {
  @IsEnum(PurchaseInvoiceDocumentType)
  documentType: PurchaseInvoiceDocumentType;

  @IsUUID()
  supplierId: string;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  supplierDocNumber?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineInputDto)
  lines: PurchaseLineInputDto[];
}
