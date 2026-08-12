import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { UsersService } from '../users/users.service';
import { CreateBusinessAdminDto } from './dto/create-business.dto';
import { TenantProvisioningService } from '../../database/tenant/tenant-provisioning.service';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    private readonly usersService: UsersService,
    private readonly tenantProvisioningService: TenantProvisioningService,
  ) {}

  async create(name: string, taxId?: string): Promise<Business> {
    const business = this.businessesRepository.create({
      name,
      taxId: taxId ?? null,
    });
    return this.businessesRepository.save(business);
  }

  /**
   * Crea un negocio nuevo ya listo para operar: aprovisiona su base de datos
   * física (rol Admin con todos los permisos actuales + lista de precios por
   * defecto sembrados ahí mismo, ver TenantProvisioningService), y sus
   * usuarios administradores (1 o 2), asignados directamente al rol Admin
   * sembrado.
   */
  async createFull(
    name: string,
    taxId: string | undefined,
    admins: CreateBusinessAdminDto[],
  ): Promise<Business> {
    const business = await this.create(name, taxId);
    const { adminRoleId } = await this.tenantProvisioningService.provisionForBusiness(business.id);

    for (const admin of admins) {
      await this.usersService.createForBusiness(business.id, {
        name: admin.name,
        email: admin.email,
        password: admin.password,
        roleId: adminRoleId,
      });
    }

    return business;
  }

  findAll(): Promise<Business[]> {
    return this.businessesRepository.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({ where: { id } });
    if (!business) {
      throw new NotFoundException(`Business ${id} not found`);
    }
    return business;
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    // Primero la BD física del inquilino (y su registro de conexión), para
    // no dejar una base huérfana en el servidor si esto se corta a la mitad.
    await this.tenantProvisioningService.deprovisionForBusiness(id);
    await this.businessesRepository.delete(id);
  }

  async update(
    id: string,
    data: { name?: string; taxId?: string | null; active?: boolean },
  ): Promise<Business> {
    const business = await this.findById(id);
    if (data.name !== undefined) business.name = data.name;
    if (data.taxId !== undefined) business.taxId = data.taxId;
    if (data.active !== undefined) business.active = data.active;
    return this.businessesRepository.save(business);
  }
}
