import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Promotion, PromotionScope } from './entities/promotion.entity';
import {
  PromotionTarget,
  PromotionTargetType,
} from './entities/promotion-target.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService extends TenantScopedService<Promotion> {
  constructor(
    @InjectRepository(Promotion) repository: Repository<Promotion>,
    @InjectRepository(PromotionTarget)
    private readonly targetsRepository: Repository<PromotionTarget>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createPromotion(dto: CreatePromotionDto): Promise<Promotion> {
    const { targets, startDate, endDate, ...rest } = dto;
    const promotion = await this.create({
      ...rest,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    if (targets?.length) {
      await this.targetsRepository.save(
        targets.map((t) =>
          this.targetsRepository.create({
            promotionId: promotion.id,
            targetType: t.targetType,
            targetId: t.targetId,
          }),
        ),
      );
    }

    return promotion;
  }

  async updatePromotion(
    id: string,
    dto: UpdatePromotionDto,
  ): Promise<Promotion> {
    const { targets, startDate, endDate, ...rest } = dto;
    const updated = await this.update(id, {
      ...rest,
      ...(startDate !== undefined
        ? { startDate: startDate ? new Date(startDate) : null }
        : {}),
      ...(endDate !== undefined
        ? { endDate: endDate ? new Date(endDate) : null }
        : {}),
    });

    if (targets) {
      await this.targetsRepository.delete({ promotionId: id });
      if (targets.length) {
        await this.targetsRepository.save(
          targets.map((t) =>
            this.targetsRepository.create({
              promotionId: id,
              targetType: t.targetType,
              targetId: t.targetId,
            }),
          ),
        );
      }
    }

    return updated;
  }

  findTargets(promotionId: string): Promise<PromotionTarget[]> {
    return this.targetsRepository.find({ where: { promotionId } });
  }

  // Promociones activas aplicables a una línea de venta: alcance 'all', o
  // alcance específico cuyo target coincide con la categoría/producto de la línea.
  async findApplicableForLine(target: {
    productId: string;
    categoryId?: string;
  }): Promise<Promotion[]> {
    const now = new Date();

    const allScope = await this.repository.find({
      where: {
        active: true,
        scope: PromotionScope.ALL,
      },
    });

    const scoped = await this.repository
      .createQueryBuilder('promotion')
      .innerJoin(
        PromotionTarget,
        'target',
        'target."promotionId" = promotion.id',
      )
      .where('promotion.active = true')
      .andWhere(
        `(target."targetType" = :productType AND target."targetId" = :productId)
         OR (target."targetType" = :categoryType AND target."targetId" = :categoryId)`,
        {
          productType: PromotionTargetType.PRODUCT,
          productId: target.productId,
          categoryType: PromotionTargetType.CATEGORY,
          categoryId: target.categoryId ?? null,
        },
      )
      .getMany();

    const all = [...allScope, ...scoped].filter((promo) =>
      this.isWithinDateRange(promo, now),
    );

    // dedup por id (una promo puede matchear varias veces)
    const unique = new Map(all.map((p) => [p.id, p]));
    return [...unique.values()];
  }

  private isWithinDateRange(promotion: Promotion, now: Date): boolean {
    if (promotion.startDate && promotion.startDate > now) return false;
    if (promotion.endDate && promotion.endDate < now) return false;
    return true;
  }
}
