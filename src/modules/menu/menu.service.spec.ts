import { MenuService } from './menu.service';
import { MenuItem } from './entities/menu-item.entity';
import { MenuAccessEffect, MenuAccessRule } from './entities/menu-access-rule.entity';

type FakeRepo<T> = { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; create: jest.Mock } & Partial<T>;

function makeMenuItem(partial: Partial<MenuItem>): MenuItem {
  return {
    id: partial.id ?? '',
    key: partial.key ?? '',
    label: partial.label ?? '',
    icon: null,
    path: partial.path ?? null,
    parentId: partial.parentId ?? null,
    sortOrder: 0,
    superAdminOnly: partial.superAdminOnly ?? false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as MenuItem;
}

describe('MenuService.resolveAccess', () => {
  // Árbol: grupo "pos" -> hojas "sales", "vouchers"; grupo "admin" (superAdminOnly) -> hoja "companies".
  const group = makeMenuItem({ id: 'g1', key: 'pos', parentId: null });
  const leafSales = makeMenuItem({ id: 'l1', key: 'sales', parentId: 'g1' });
  const leafVouchers = makeMenuItem({ id: 'l2', key: 'vouchers', parentId: 'g1' });
  const adminGroup = makeMenuItem({ id: 'g2', key: 'admin', parentId: null });
  const leafCompanies = makeMenuItem({ id: 'l3', key: 'companies', parentId: 'g2', superAdminOnly: true });
  const items = [group, leafSales, leafVouchers, adminGroup, leafCompanies];

  function buildService(rules: MenuAccessRule[]) {
    const menuItemsRepo: FakeRepo<MenuItem> = {
      find: jest.fn().mockResolvedValue(items),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    const rulesRepo: FakeRepo<MenuAccessRule> = {
      find: jest.fn().mockResolvedValue(rules),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((x) => x),
    };
    return new MenuService(menuItemsRepo as never, rulesRepo as never);
  }

  it('deniega todo por defecto cuando no hay ninguna regla', async () => {
    const service = buildService([]);
    const access = await service.resolveAccess('m1', false);
    expect(access.pos).toBe(false);
    expect(access.sales).toBe(false);
  });

  it('un ALLOW en el grupo se hereda a sus hijas sin regla propia', async () => {
    const service = buildService([
      { membershipId: 'm1', menuItemId: 'g1', effect: MenuAccessEffect.ALLOW } as MenuAccessRule,
    ]);
    const access = await service.resolveAccess('m1', false);
    expect(access.pos).toBe(true);
    expect(access.sales).toBe(true);
    expect(access.vouchers).toBe(true);
  });

  it('un DENY explícito en una hoja gana sobre el ALLOW heredado del grupo', async () => {
    const service = buildService([
      { membershipId: 'm1', menuItemId: 'g1', effect: MenuAccessEffect.ALLOW } as MenuAccessRule,
      { membershipId: 'm1', menuItemId: 'l2', effect: MenuAccessEffect.DENY } as MenuAccessRule,
    ]);
    const access = await service.resolveAccess('m1', false);
    expect(access.sales).toBe(true);
    expect(access.vouchers).toBe(false);
  });

  it('superAdminOnly bloquea siempre a quien no es superadmin, incluso con ALLOW explícito', async () => {
    const service = buildService([
      { membershipId: 'm1', menuItemId: 'g2', effect: MenuAccessEffect.ALLOW } as MenuAccessRule,
      { membershipId: 'm1', menuItemId: 'l3', effect: MenuAccessEffect.ALLOW } as MenuAccessRule,
    ]);
    const access = await service.resolveAccess('m1', false);
    expect(access.companies).toBe(false);
  });

  it('superAdminOnly no bloquea a un superadmin', async () => {
    const service = buildService([
      { membershipId: 'm1', menuItemId: 'g2', effect: MenuAccessEffect.ALLOW } as MenuAccessRule,
      { membershipId: 'm1', menuItemId: 'l3', effect: MenuAccessEffect.ALLOW } as MenuAccessRule,
    ]);
    const access = await service.resolveAccess('m1', true);
    expect(access.companies).toBe(true);
  });
});
