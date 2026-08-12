import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService extends TenantScopedService<Customer> {
  constructor(
    @InjectRepository(Customer) repository: Repository<Customer>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  /**
   * Si ya existe un cliente con el mismo email o documento en el negocio
   * (ej. creado antes por el cajero en el POS), reutiliza ese registro en
   * vez de duplicarlo — así un mismo cliente conserva un solo historial
   * aunque compre por distintos canales.
   */
  async createOrReuse(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.findExisting(dto.email, dto.docNumber);
    if (existing) {
      return existing;
    }
    return this.create(dto);
  }

  private async findExisting(
    email?: string,
    docNumber?: string,
  ): Promise<Customer | null> {
    if (email) {
      const byEmail = await this.repository.findOne({ where: { email } });
      if (byEmail) return byEmail;
    }
    if (docNumber) {
      const byDoc = await this.repository.findOne({ where: { docNumber } });
      if (byDoc) return byDoc;
    }
    return null;
  }
}
