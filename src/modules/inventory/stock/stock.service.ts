import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { TENANT_DATA_SOURCE } from '../../../database/tenant/tenant-orm.module';
import { TenantContext } from '../../../common/tenant/tenant-context';
import { Stock } from './entities/stock.entity';
import { StockMovementType } from './entities/stock-movement.entity';
import { StockMovementsService } from './stock-movements.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { ProductsService } from '../../products/products.service';
import { AdjustStockDto, StockAdjustMode } from './dto/adjust-stock.dto';
import { ApplyStockCountDto } from './dto/apply-stock-count.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly warehousesService: WarehousesService,
    private readonly productsService: ProductsService,
    private readonly stockMovementsService: StockMovementsService,
    @Inject(TENANT_DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  findAll(filters: { warehouseId?: string; productId?: string }) {
    const where: FindOptionsWhere<Stock> = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.productId) where.productId = filters.productId;
    return this.stockRepository.find({ where });
  }

  async adjust(dto: AdjustStockDto): Promise<Stock> {
    await this.validateOwner(dto.productId);
    await this.warehousesService.findOneOrFail(dto.warehouseId);

    return this.dataSource.transaction(async (manager) => {
      const stockRepo = manager.getRepository(Stock);
      const where: FindOptionsWhere<Stock> = {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
      };

      let stock = await stockRepo.findOne({ where });
      const before = stock ? Number(stock.quantity) : 0;

      if (!stock) {
        stock = stockRepo.create({
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: 0,
        });
      }

      stock.quantity =
        dto.mode === StockAdjustMode.SET ? dto.quantity : before + dto.quantity;
      const saved = await stockRepo.save(stock);

      await this.stockMovementsService.record(
        {
          businessId: this.tenantContext.businessId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantityDelta: Number(saved.quantity) - before,
          quantityAfter: Number(saved.quantity),
          type:
            dto.mode === StockAdjustMode.SET
              ? StockMovementType.ADJUSTMENT_SET
              : StockMovementType.ADJUSTMENT_ADD,
          userId: this.tenantContext.currentUser?.userId,
        },
        manager,
      );

      return saved;
    });
  }

  /** Conteo físico: fija el stock a la cantidad contada y deja registrado el motivo/diferencia. */
  async applyCount(dto: ApplyStockCountDto): Promise<Stock> {
    await this.validateOwner(dto.productId);
    await this.warehousesService.findOneOrFail(dto.warehouseId);

    return this.dataSource.transaction(async (manager) => {
      const stockRepo = manager.getRepository(Stock);
      const where: FindOptionsWhere<Stock> = {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
      };

      let stock = await stockRepo.findOne({ where });
      const before = stock ? Number(stock.quantity) : 0;

      if (!stock) {
        stock = stockRepo.create({
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: 0,
        });
      }

      stock.quantity = dto.countedQuantity;
      const saved = await stockRepo.save(stock);

      await this.stockMovementsService.record(
        {
          businessId: this.tenantContext.businessId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantityDelta: dto.countedQuantity - before,
          quantityAfter: dto.countedQuantity,
          type: StockMovementType.COUNT,
          reason: dto.reason,
          userId: this.tenantContext.currentUser?.userId,
        },
        manager,
      );

      return saved;
    });
  }

  private async validateOwner(productId: string): Promise<void> {
    const product = await this.productsService.findOneOrFail(productId);
    if (!product.tracksInventory) {
      throw new BadRequestException(
        'Este producto no maneja inventario (tracksInventory = false)',
      );
    }
  }
}
