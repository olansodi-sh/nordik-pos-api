import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateProductImageDto {
  @IsString()
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
