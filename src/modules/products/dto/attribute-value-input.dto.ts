import { IsString, IsUUID, MinLength } from 'class-validator';

export class AttributeValueInputDto {
  @IsUUID()
  attributeDefinitionId: string;

  @IsString()
  @MinLength(1)
  value: string;
}
