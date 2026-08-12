import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { WarehousesService } from '../inventory/warehouses/warehouses.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';

@Injectable()
export class PurchaseOrdersService extends TenantScopedService<PurchaseOrder> {
  constructor(
    @InjectRepository(PurchaseOrder) repository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderLine)
    private readonly linesRepository: Repository<PurchaseOrderLine>,
    private readonly suppliersService: SuppliersService,
    private readonly warehousesService: WarehousesService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async findLines(orderId: string): Promise<PurchaseOrderLine[]> {
    await this.findOneOrFail(orderId);
    return this.linesRepository.find({ where: { orderId } });
  }

  async createOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    await this.suppliersService.findOneOrFail(dto.supplierId);
    await this.warehousesService.findOneOrFail(dto.warehouseId);

    const total = dto.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitCost,
      0,
    );

    const order = await this.create({
      number: generateDocumentNumber('OC'),
      supplierId: dto.supplierId,
      warehouseId: dto.warehouseId,
      date: dto.date ?? new Date().toISOString().slice(0, 10),
      total,
    });

    await this.linesRepository.save(
      dto.lines.map((line) =>
        this.linesRepository.create({
          orderId: order.id,
          productId: line.productId,
          description: line.description ?? '',
          quantity: line.quantity,
          unitCost: line.unitCost,
          total: line.quantity * line.unitCost,
        }),
      ),
    );

    return order;
  }

  updateStatus(
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
  ): Promise<PurchaseOrder> {
    return this.update(id, { status: dto.status });
  }
}
