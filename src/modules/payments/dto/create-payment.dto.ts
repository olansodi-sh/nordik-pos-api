import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class PaymentAllocationInputDto {
  @IsUUID()
  saleId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsUUID()
  cashSessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationInputDto)
  allocations: PaymentAllocationInputDto[];
}
