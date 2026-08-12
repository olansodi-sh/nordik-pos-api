import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { TenantConnectionManager } from '../../database/tenant/tenant-connection-manager.service';

const DEFAULT_ROLE_NAMES = {
  admin: 'Admin',
  seller: 'Vendedor',
  cashier: 'Cajero',
} as const;

/**
 * CRUD de roles, por inquilino. A diferencia de los demás servicios de
 * negocio, no usa un repositorio inyectado vía TenantOrmModule.forFeature
 * (que quedaría atado al inquilino de la petición actual) — resuelve la
 * conexión explícitamente por businessId en cada llamada, para poder servir
 * también el caso de un superadministrador consultando los roles de OTRO
 * negocio.
 */
@Injectable()
export class RolesService {
  constructor(private readonly tenantConnectionManager: TenantConnectionManager) {}

  private async repo(businessId: string) {
    const ds = await this.tenantConnectionManager.getDataSourceForTenant(businessId);
    return ds.getRepository(Role);
  }

  /**
   * Crea los roles base (Admin, Vendedor, Cajero) para un negocio nuevo.
   * Admin recibe todos los permisos; los demás nacen vacíos para que el
   * dueño del negocio los configure a su gusto. Se llama desde
   * TenantProvisioningService justo después de sincronizar el esquema del
   * inquilino, con el permissionCodes ya resuelto (evita depender del
   * catálogo de Permission, que vive en la BD central).
   */
  async seedDefaultRoles(
    businessId: string,
    allPermissionCodes: string[],
  ): Promise<Role> {
    const repo = await this.repo(businessId);
    const admin = await repo.save(
      repo.create({ name: DEFAULT_ROLE_NAMES.admin, permissionCodes: allPermissionCodes }),
    );
    await repo.save([
      repo.create({ name: DEFAULT_ROLE_NAMES.seller, permissionCodes: [] }),
      repo.create({ name: DEFAULT_ROLE_NAMES.cashier, permissionCodes: [] }),
    ]);
    return admin;
  }

  async findRolesForBusiness(businessId: string): Promise<Role[]> {
    const repo = await this.repo(businessId);
    return repo.find({ order: { name: 'ASC' } });
  }

  async findRoleOrFail(businessId: string, id: string): Promise<Role> {
    const repo = await this.repo(businessId);
    const role = await repo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
    return role;
  }

  async createRole(businessId: string, dto: CreateRoleDto): Promise<Role> {
    const repo = await this.repo(businessId);
    const role = repo.create({
      name: dto.name,
      description: dto.description ?? null,
      permissionCodes: dto.permissionCodes ?? [],
    });
    return repo.save(role);
  }

  async updateRole(businessId: string, id: string, dto: UpdateRoleDto): Promise<Role> {
    const repo = await this.repo(businessId);
    const role = await this.findRoleOrFail(businessId, id);

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionCodes !== undefined) role.permissionCodes = dto.permissionCodes;

    return repo.save(role);
  }

  async removeRole(businessId: string, id: string): Promise<void> {
    const repo = await this.repo(businessId);
    const role = await this.findRoleOrFail(businessId, id);
    await repo.softRemove(role);
  }
}
