import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';
import { InvoicingProvider } from '../entities/business-invoicing-settings.entity';

export class UpdateInvoicingSettingsDto {
  @IsOptional()
  @IsBoolean()
  electronicInvoicingEnabled?: boolean;

  @IsOptional()
  @IsEnum(InvoicingProvider)
  provider?: InvoicingProvider;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;
}
