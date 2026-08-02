import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AdjustLoyaltyPointsDto {
  @IsUUID()
  customerId: string;

  @IsInt()
  @IsNotEmpty()
  points: number;

  @IsOptional()
  @IsString()
  description?: string;
}
