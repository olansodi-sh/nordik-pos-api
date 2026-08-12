import { Body, Controller, Get, NotFoundException, Param, Put } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import { TenantContext } from '../../common/tenant/tenant-context';
import { MenuService } from './menu.service';
import { MembershipsService } from '../memberships/memberships.service';
import { SetMenuRuleDto } from './dto/set-menu-rule.dto';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly membershipsService: MembershipsService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get('my-access')
  myAccess(@CurrentUser() user: AuthenticatedUser) {
    if (!user.membershipId) {
      return {};
    }
    return this.menuService.resolveAccess(user.membershipId, user.isSuperAdmin);
  }

  @RequirePermissions('users.manage')
  @Get('items')
  findAllItems() {
    return this.menuService.findAllActive();
  }

  /** Reglas explícitas (allow/deny) del usuario en el negocio actual — para la UI de administración. */
  @RequirePermissions('users.manage')
  @Get('rules/by-user/:userId')
  async rulesForUser(@Param('userId') userId: string) {
    const membership = await this.membershipsService.findForUserAndBusiness(
      userId,
      this.tenantContext.businessId,
    );
    if (!membership) {
      throw new NotFoundException('El usuario no tiene una membresía en este negocio');
    }
    return this.menuService.findRulesForMembership(membership.id);
  }

  @RequirePermissions('users.manage')
  @Put('rules/by-user/:userId/:menuItemId')
  async setRuleForUser(
    @Param('userId') userId: string,
    @Param('menuItemId') menuItemId: string,
    @Body() dto: SetMenuRuleDto,
  ) {
    const membership = await this.membershipsService.findForUserAndBusiness(
      userId,
      this.tenantContext.businessId,
    );
    if (!membership) {
      throw new NotFoundException('El usuario no tiene una membresía en este negocio');
    }
    await this.menuService.setRule(membership.id, menuItemId, dto.effect ?? null);
    return { ok: true };
  }
}
