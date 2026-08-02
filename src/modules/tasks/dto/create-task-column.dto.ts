import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskColumnDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
