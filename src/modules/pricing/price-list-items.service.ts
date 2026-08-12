import { Injectable } from '@nestjs/common';
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

    const where: FindOptionsWhere<PriceListItem> = {
      priceListId,
      productId: dto.productId,
    };

    let item = await this.itemsRepository.findOne({ where });
    if (!item) {
      item = this.itemsRepository.create({
        priceListId,
        productId: dto.productId,
        price: dto.price,
      });
    } else {
      item.price = dto.price;
    }

    return this.itemsRepository.save(item);
  }

  // Usado por ventas: precio para un producto en una lista dada.
  async resolvePrice(
    priceListId: string,
    target: { productId: string },
  ): Promise<number | null> {
    const item = await this.itemsRepository.findOne({
      where: { priceListId, productId: target.productId },
    });
    return item ? Number(item.price) : null;
  }
}
