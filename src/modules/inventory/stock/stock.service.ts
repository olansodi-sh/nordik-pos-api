import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { WarehousesService } from '../warehouses/warehouses.service';
import { ProductsService } from '../../products/products.service';
import { ProductVariantsService } from '../../products/product-variants.service';
import { AdjustStockDto, StockAdjustMode } from './dto/adjust-stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  findAll(filters: {
    warehouseId?: string;
    variantId?: string;
    productId?: string;
  }) {
    const where: FindOptionsWhere<Stock> = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.variantId) where.variantId = filters.variantId;
    if (filters.productId) where.productId = filters.productId;
    return this.stockRepository.find({ where });
  }

  async adjust(dto: AdjustStockDto): Promise<Stock> {
    if (!dto.variantId && !dto.productId) {
      throw new BadRequestException('Debes indicar variantId o productId');
    }
    if (dto.variantId && dto.productId) {
      throw new BadRequestException(
        'Solo puedes indicar uno: variantId o productId',
      );
    }

    await this.warehousesService.findOneOrFail(dto.warehouseId);

    if (dto.productId) {
      const product = await this.productsService.findOneOrFail(dto.productId);
      if (!product.tracksInventory) {
        throw new BadRequestException(
          'Este producto no maneja inventario (tracksInventory = false)',
        );
      }
      if (product.hasVariants) {
        throw new BadRequestException(
          'Este producto maneja variantes: ajusta el stock por variante, no por producto',
        );
      }
    }

    if (dto.variantId) {
      // findOneOrFail necesita el productId del padre; buscamos la variante
      // directamente por id ya que el stock no conoce el producto dueño.
      const variant = await this.productVariantsService.findVariantByIdOrFail(
        dto.variantId,
      );
      const product = await this.productsService.findOneOrFail(
        variant.productId,
      );
      if (!product.tracksInventory) {
        throw new BadRequestException(
          'Este producto no maneja inventario (tracksInventory = false)',
        );
      }
    }

    const where: FindOptionsWhere<Stock> = dto.variantId
      ? { variantId: dto.variantId, warehouseId: dto.warehouseId }
      : { productId: dto.productId, warehouseId: dto.warehouseId };

    let stock = await this.stockRepository.findOne({ where });

    if (!stock) {
      stock = this.stockRepository.create({
        variantId: dto.variantId ?? null,
        productId: dto.productId ?? null,
        warehouseId: dto.warehouseId,
        quantity: 0,
      });
    }

    stock.quantity =
      dto.mode === StockAdjustMode.SET
        ? dto.quantity
        : Number(stock.quantity) + dto.quantity;

    return this.stockRepository.save(stock);
  }
}
