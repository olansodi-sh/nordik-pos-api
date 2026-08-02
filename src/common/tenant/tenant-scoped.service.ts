import { NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { TenantContext } from './tenant-context';

/**
 * Base para servicios de entidades con businessId (TenantBaseEntity).
 * Todas las lecturas/escrituras quedan automáticamente acotadas al negocio
 * del usuario autenticado — un servicio concreto solo necesita extender
 * esta clase para heredar el aislamiento por tenant, sin repetir el filtro
 * a mano en cada método.
 */
export abstract class TenantScopedService<
  T extends ObjectLiteral & { businessId: string },
> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly tenantContext: TenantContext,
  ) {}

  findAll(where: FindOptionsWhere<T> = {}): Promise<T[]> {
    return this.repository.find({
      where: {
        ...where,
        businessId: this.tenantContext.businessId,
      } as unknown as FindOptionsWhere<T>,
    });
  }

  async findOneOrFail(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: {
        id,
        businessId: this.tenantContext.businessId,
      } as unknown as FindOptionsWhere<T>,
    });
    if (!entity) {
      throw new NotFoundException(
        `${this.repository.metadata.name} ${id} not found`,
      );
    }
    return entity;
  }

  create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create({
      ...data,
      businessId: this.tenantContext.businessId,
    } as DeepPartial<T>);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findOneOrFail(id);
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOneOrFail(id);
    await this.repository.softRemove(entity);
  }
}
