import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCustomFieldDto } from './create-custom-field.dto';

export class UpdateCustomFieldDto extends PartialType(CreateCustomFieldDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
