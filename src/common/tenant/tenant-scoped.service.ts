import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { TenantContext } from './tenant-context';

/**
 * Base para servicios de entidades del inquilino. El aislamiento por negocio
 * ya no es un filtro por columna (businessId): el repositorio inyectado está
 * conectado a la base de datos física de ese inquilino (ver TenantOrmModule),
 * así que un servicio concreto solo necesita extender esta clase para
 * heredar CRUD genérico, sin repetirlo a mano en cada módulo.
 */
export abstract class TenantScopedService<T extends ObjectLiteral & { id: string }> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly tenantContext: TenantContext,
  ) {}

  findAll(where: FindOptionsWhere<T> = {}): Promise<T[]> {
    return this.repository.find({ where });
  }

  async findOneOrFail(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
    if (!entity) {
      throw new NotFoundException(
        `${this.repository.metadata.name} ${id} not found`,
      );
    }
    return entity;
  }

  create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
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
