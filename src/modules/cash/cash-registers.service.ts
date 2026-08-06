import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { WarehousesService } from '../inventory/warehouses/warehouses.service';
import { CashRegister } from './entities/cash-register.entity';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';

@Injectable()
export class CashRegistersService extends TenantScopedService<CashRegister> {
  constructor(
    @InjectRepository(CashRegister) repository: Repository<CashRegister>,
    private readonly warehousesService: WarehousesService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createRegister(dto: CreateCashRegisterDto): Promise<CashRegister> {
    await this.warehousesService.findOneOrFail(dto.warehouseId);
    return this.create(dto);
  }

  findByWarehouse(warehouseId: string): Promise<CashRegister[]> {
    return this.findAll({ warehouseId });
  }
}
