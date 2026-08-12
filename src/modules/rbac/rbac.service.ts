import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { BASE_PERMISSIONS } from './permissions.constants';

/**
 * Catálogo global de permisos (BD central, singleton). Los roles — que sí
 * son por inquilino y viven en la BD física de cada negocio — se manejan en
 * RolesService.
 */
@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
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

  findAllPermissions(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { code: 'ASC' } });
  }
}
