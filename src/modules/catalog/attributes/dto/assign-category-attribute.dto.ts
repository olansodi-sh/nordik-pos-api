import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AssignCategoryAttributeDto {
  @IsUUID()
  attributeDefinitionId: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
