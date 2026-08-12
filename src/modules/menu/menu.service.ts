import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { MenuAccessEffect, MenuAccessRule } from './entities/menu-access-rule.entity';
import { MENU_TREE } from './menu-tree.constants';

@Injectable()
export class MenuService implements OnModuleInit {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(MenuAccessRule)
    private readonly rulesRepository: Repository<MenuAccessRule>,
  ) {}

  async onModuleInit() {
    await this.seedMenuTree();
  }

  /** Crea/actualiza los MenuItem para que reflejen MENU_TREE (upsert por key). */
  private async seedMenuTree(): Promise<void> {
    let sortOrder = 0;
    for (const group of MENU_TREE) {
      const groupItem = await this.upsert({
        key: group.key,
        label: group.label,
        icon: group.icon,
        path: null,
        parentId: null,
        sortOrder: sortOrder++,
        superAdminOnly: false,
      });

      let childOrder = 0;
      for (const leaf of group.children) {
        await this.upsert({
          key: leaf.key,
          label: leaf.label,
          icon: leaf.icon,
          path: leaf.path,
          parentId: groupItem.id,
          sortOrder: childOrder++,
          superAdminOnly: leaf.superAdminOnly ?? false,
        });
      }
    }
  }

  private async upsert(data: {
    key: string;
    label: string;
    icon: string;
    path: string | null;
    parentId: string | null;
    sortOrder: number;
    superAdminOnly: boolean;
  }): Promise<MenuItem> {
    const existing = await this.menuItemsRepository.findOne({ where: { key: data.key } });
    if (existing) {
      Object.assign(existing, data);
      return this.menuItemsRepository.save(existing);
    }
    return this.menuItemsRepository.save(this.menuItemsRepository.create(data));
  }

  findAllActive(): Promise<MenuItem[]> {
    return this.menuItemsRepository.find({ where: { active: true }, order: { sortOrder: 'ASC' } });
  }

  /**
   * Resuelve, para una membresía, qué ítems de menú son visibles: sube por
   * la cadena de ancestros y usa la primera regla encontrada (la más
   * cercana gana); sin ninguna regla en la cadena, deniega por defecto.
   * superAdminOnly es una pared dura, fuera de las reglas.
   */
  async resolveAccess(
    membershipId: string,
    isSuperAdmin: boolean,
  ): Promise<Record<string, boolean>> {
    const [items, rules] = await Promise.all([
      this.findAllActive(),
      this.rulesRepository.find({ where: { membershipId } }),
    ]);

    const itemsById = new Map(items.map((i) => [i.id, i]));
    const ruleByItemId = new Map(rules.map((r) => [r.menuItemId, r.effect]));

    const result: Record<string, boolean> = {};
    for (const item of items) {
      if (item.superAdminOnly && !isSuperAdmin) {
        result[item.key] = false;
        continue;
      }

      let allowed = false;
      let cursor: MenuItem | undefined = item;
      while (cursor) {
        const effect = ruleByItemId.get(cursor.id);
        if (effect) {
          allowed = effect === MenuAccessEffect.ALLOW;
          break;
        }
        cursor = cursor.parentId ? itemsById.get(cursor.parentId) : undefined;
      }
      result[item.key] = allowed;
    }
    return result;
  }

  /**
   * Siembra un ALLOW en cada grupo de nivel superior para una membresía
   * nueva — sin esto, el sidebar quedaría vacío por defecto (deny-by-default).
   */
  async seedBaselineAccess(membershipId: string): Promise<void> {
    const topLevelGroups = await this.menuItemsRepository.find({ where: { parentId: IsNull() } });
    for (const group of topLevelGroups) {
      const existing = await this.rulesRepository.findOne({
        where: { membershipId, menuItemId: group.id },
      });
      if (existing) continue;
      await this.rulesRepository.save(
        this.rulesRepository.create({
          membershipId,
          menuItemId: group.id,
          effect: MenuAccessEffect.ALLOW,
        }),
      );
    }
    this.logger.log(`Reglas de menú por defecto sembradas para la membresía ${membershipId}`);
  }

  findRulesForMembership(membershipId: string): Promise<MenuAccessRule[]> {
    return this.rulesRepository.find({ where: { membershipId } });
  }

  async setRule(
    membershipId: string,
    menuItemId: string,
    effect: MenuAccessEffect | null,
  ): Promise<void> {
    const existing = await this.rulesRepository.findOne({ where: { membershipId, menuItemId } });
    if (!effect) {
      if (existing) await this.rulesRepository.remove(existing);
      return;
    }
    if (existing) {
      existing.effect = effect;
      await this.rulesRepository.save(existing);
      return;
    }
    await this.rulesRepository.save(
      this.rulesRepository.create({ membershipId, menuItemId, effect }),
    );
  }
}
