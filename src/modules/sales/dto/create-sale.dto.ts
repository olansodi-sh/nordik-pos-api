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
  ValidateNested,
} from 'class-validator';
import { SalesChannel } from '../entities/sale.entity';

export class CreateSaleLineDto {
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  // Si se envía, se usa tal cual (sin resolver lista de precios ni
  // promociones) — para conversiones desde cotización, donde el precio ya
  // quedó pactado con el cliente.
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsEnum(SalesChannel)
  channel?: SalesChannel;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  cashSessionId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  // Nombre libre para dejar la venta como "cuenta abierta" (ej. "Mesa 3").
  @IsOptional()
  @IsString()
  label?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineDto)
  lines: CreateSaleLineDto[];
}

export class AddSaleLinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineDto)
  lines: CreateSaleLineDto[];
}
