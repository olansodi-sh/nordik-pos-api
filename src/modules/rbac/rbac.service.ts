import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { BASE_PERMISSIONS } from './permissions.constants';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const DEFAULT_ROLE_NAMES = {
  admin: 'Admin',
  seller: 'Vendedor',
  cashier: 'Cajero',
} as const;

// Nota: NO inyecta TenantContext (request-scoped) en el constructor — este
// servicio implementa OnModuleInit para sembrar los permisos base al
// arrancar la app, y los hooks de ciclo de vida no se ejecutan para
// providers request-scoped (solo se instancian dentro de una petición). El
// businessId se recibe explícito por parámetro en los métodos que lo
// necesitan.
@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.ensureBasePermissions();
  }

  private async ensureBasePermissions(): Promise<void> {
    const existing = await this.permissionsRepository.find();
    const existingCodes = new Set(existing.map((p) => p.code));
    const missing = BASE_PERMISSIONS.filter((code) => !existingCodes.has(code));

    if (missing.length === 0) return;

    await this.permissionsRepository.save(
      missing.map((code) => this.permissionsRepository.create({ code })),
    );
    this.logger.log(`Seeded ${missing.length} base permissions`);
  }

  /**
   * Crea los roles base (Admin, Vendedor, Cajero) para un negocio nuevo.
   * Admin recibe todos los permisos; los demás nacen vacíos para que el
   * dueño del negocio los configure a su gusto.
   */
  async seedDefaultRolesForBusiness(businessId: string): Promise<Role> {
    const allPermissions = await this.permissionsRepository.find();

    const admin = await this.rolesRepository.save(
      this.rolesRepository.create({
        businessId,
        name: DEFAULT_ROLE_NAMES.admin,
        permissions: allPermissions,
      }),
    );

    await this.rolesRepository.save([
      this.rolesRepository.create({
        businessId,
        name: DEFAULT_ROLE_NAMES.seller,
      }),
      this.rolesRepository.create({
        businessId,
        name: DEFAULT_ROLE_NAMES.cashier,
      }),
    ]);

    return admin;
  }

  findAllPermissions(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { code: 'ASC' } });
  }

  findRolesForBusiness(businessId: string): Promise<Role[]> {
    return this.rolesRepository.find({
      where: { businessId },
      relations: { permissions: true },
    });
  }

  async findRoleOrFail(businessId: string, id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id, businessId },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
    return role;
  }

  async createRole(businessId: string, dto: CreateRoleDto): Promise<Role> {
    const permissions = dto.permissionCodes?.length
      ? await this.permissionsRepository.find({
          where: { code: In(dto.permissionCodes) },
        })
      : [];

    const role = this.rolesRepository.create({
      businessId,
      name: dto.name,
      description: dto.description ?? null,
      permissions,
    });
    return this.rolesRepository.save(role);
  }

  async updateRole(
    businessId: string,
    id: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.findRoleOrFail(businessId, id);

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionCodes !== undefined) {
      role.permissions = dto.permissionCodes.length
        ? await this.permissionsRepository.find({
            where: { code: In(dto.permissionCodes) },
          })
        : [];
    }

    return this.rolesRepository.save(role);
  }

  async removeRole(businessId: string, id: string): Promise<void> {
    const role = await this.findRoleOrFail(businessId, id);
    await this.rolesRepository.softRemove(role);
  }
}
