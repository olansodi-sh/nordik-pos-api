import { IsEnum, IsOptional } from 'class-validator';
import { MenuAccessEffect } from '../entities/menu-access-rule.entity';

export class SetMenuRuleDto {
  // null/omitido = "heredar" (borra la regla explícita en este ítem).
  @IsOptional()
  @IsEnum(MenuAccessEffect)
  effect?: MenuAccessEffect | null;
}
