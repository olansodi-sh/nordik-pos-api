import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { PriceList } from './entities/price-list.entity';
import { PriceListItem } from './entities/price-list-item.entity';

@Injectable()
export class PriceListsService extends TenantScopedService<PriceList> {
  constructor(
    @InjectRepository(PriceList) repository: Repository<PriceList>,
    @InjectRepository(PriceListItem)
    private readonly itemsRepository: Repository<PriceListItem>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  /** Se llama al registrar un negocio nuevo: nace con su lista "Consumidor Final". */
  async createDefaultForBusiness(businessId: string): Promise<PriceList> {
    return this.repository.save(
      this.repository.create({
        businessId,
        name: 'Consumidor Final',
        isDefault: true,
      }),
    );
  }

  async findDefault(): Promise<PriceList | null> {
    return this.repository.findOne({
      where: { businessId: this.tenantContext.businessId, isDefault: true },
    });
  }

  /** Clona los precios de una lista existente como punto de partida para una nueva. */
  async clone(sourceId: string, name: string): Promise<PriceList> {
    const source = await this.findOneOrFail(sourceId);
    const items = await this.itemsRepository.find({
      where: { priceListId: source.id },
    });

    const clone = await this.create({ name });

    if (items.length) {
      await this.itemsRepository.save(
        items.map((item) =>
          this.itemsRepository.create({
            priceListId: clone.id,
            variantId: item.variantId,
            productId: item.productId,
            price: item.price,
          }),
        ),
      );
    }

    return clone;
  }
}
