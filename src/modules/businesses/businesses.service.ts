import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { RbacService } from '../rbac/rbac.service';
import { PriceListsService } from '../pricing/price-lists.service';
import { UsersService } from '../users/users.service';
import { CreateBusinessAdminDto } from './dto/create-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    private readonly rbacService: RbacService,
    private readonly priceListsService: PriceListsService,
    private readonly usersService: UsersService,
  ) {}

  async create(name: string, taxId?: string): Promise<Business> {
    const business = this.businessesRepository.create({
      name,
      taxId: taxId ?? null,
    });
    return this.businessesRepository.save(business);
  }

  /**
   * Crea un negocio nuevo ya listo para operar: rol Admin (con todos los
   * permisos actuales), lista de precios por defecto, y sus usuarios
   * administradores (1 o 2), asignados directamente al rol Admin sembrado.
   */
  async createFull(
    name: string,
    taxId: string | undefined,
    admins: CreateBusinessAdminDto[],
  ): Promise<Business> {
    const business = await this.create(name, taxId);
    const adminRole = await this.rbacService.seedDefaultRolesForBusiness(business.id);
    await this.priceListsService.createDefaultForBusiness(business.id);

    for (const admin of admins) {
      await this.usersService.createForBusiness(business.id, {
        name: admin.name,
        email: admin.email,
        password: admin.password,
        roleId: adminRole.id,
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
