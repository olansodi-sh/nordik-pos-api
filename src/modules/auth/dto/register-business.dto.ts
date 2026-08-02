import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterBusinessDto {
  @IsString()
  @MinLength(2)
  businessName: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsString()
  @MinLength(2)
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;
}
