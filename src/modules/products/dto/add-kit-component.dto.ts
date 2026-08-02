import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddKitComponentDto {
  @IsOptional()
  @IsUUID()
  componentVariantId?: string;

  @IsOptional()
  @IsUUID()
  componentProductId?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}
