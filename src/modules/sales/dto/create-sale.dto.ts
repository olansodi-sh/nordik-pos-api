import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { SalesChannel } from '../entities/sale.entity';

export class CreateSaleLineDto {
  @IsUUID()
  productId: string;

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

  // Valores de los campos personalizados definidos para Venta (ver
  // CustomFieldDefinition) — se validan contra esas definiciones al crear.
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;

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
