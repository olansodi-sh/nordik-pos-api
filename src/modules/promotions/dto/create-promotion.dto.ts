import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionScope, PromotionType } from '../entities/promotion.entity';
import { PromotionTargetType } from '../entities/promotion-target.entity';

class ConditionsDto {
  @IsNumber()
  buyQty: number;

  @IsNumber()
  getQty: number;
}

class TargetDto {
  @IsEnum(PromotionTargetType)
  targetType: PromotionTargetType;

  @IsUUID()
  targetId: string;
}

export class CreatePromotionDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConditionsDto)
  conditions?: ConditionsDto;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetDto)
  targets?: TargetDto[];
}
