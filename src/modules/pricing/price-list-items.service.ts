import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PriceListItem } from './entities/price-list-item.entity';
import { PriceListsService } from './price-lists.service';
import { SetPriceListItemDto } from './dto/set-price-list-item.dto';

@Injectable()
export class PriceListItemsService {
  constructor(
    @InjectRepository(PriceListItem)
    private readonly itemsRepository: Repository<PriceListItem>,
    private readonly priceListsService: PriceListsService,
  ) {}

  async findByList(priceListId: string): Promise<PriceListItem[]> {
    await this.priceListsService.findOneOrFail(priceListId);
    return this.itemsRepository.find({ where: { priceListId } });
  }

  async setPrice(
    priceListId: string,
    dto: SetPriceListItemDto,
  ): Promise<PriceListItem> {
    await this.priceListsService.findOneOrFail(priceListId);

    if (!dto.variantId && !dto.productId) {
      throw new BadRequestException('Debes indicar variantId o productId');
    }
    if (dto.variantId && dto.productId) {
      throw new BadRequestException(
        'Solo puedes indicar uno: variantId o productId',
      );
    }

    const where: FindOptionsWhere<PriceListItem> = dto.variantId
      ? { priceListId, variantId: dto.variantId }
      : { priceListId, productId: dto.productId };

    let item = await this.itemsRepository.findOne({ where });
    if (!item) {
      item = this.itemsRepository.create({
        priceListId,
        variantId: dto.variantId ?? null,
        productId: dto.productId ?? null,
        price: dto.price,
      });
    } else {
      item.price = dto.price;
    }

    return this.itemsRepository.save(item);
  }

  /** Usado por ventas: precio para una variante/producto en una lista dada. */
  async resolvePrice(
    priceListId: string,
    target: { variantId?: string; productId?: string },
  ): Promise<number | null> {
    const where: FindOptionsWhere<PriceListItem> = target.variantId
      ? { priceListId, variantId: target.variantId }
      : { priceListId, productId: target.productId };

    const item = await this.itemsRepository.findOne({ where });
    return item ? Number(item.price) : null;
  }
}
