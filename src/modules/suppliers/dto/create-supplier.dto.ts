import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { DocType } from '../../customers/entities/customer.entity';

export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsEnum(DocType)
  docType?: DocType;

  @IsOptional()
  @IsString()
  docNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
