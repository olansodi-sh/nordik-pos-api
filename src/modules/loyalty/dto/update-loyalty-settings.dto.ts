import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLoyaltySettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsPerAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amountUnit?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
