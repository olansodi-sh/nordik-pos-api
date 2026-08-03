import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  // Solo tiene efecto si quien crea el usuario es superadministrador;
  // de lo contrario se ignora y se usa el negocio de quien hace la petición.
  @IsOptional()
  @IsUUID()
  businessId?: string;
}
