import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { RbacService } from '../rbac/rbac.service';
import { PriceListsService } from '../pricing/price-lists.service';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    private readonly rbacService: RbacService,
    private readonly priceListsService: PriceListsService,
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
   * permisos actuales) + lista de precios por defecto. Usado por el flujo
   * de superadministrador ("Empresas"), que crea el tenant sin todavía
   * tener un usuario admin — ese se crea aparte desde Usuarios.
   */
  async createFull(name: string, taxId?: string): Promise<Business> {
    const business = await this.create(name, taxId);
    await this.rbacService.seedDefaultRolesForBusiness(business.id);
    await this.priceListsService.createDefaultForBusiness(business.id);
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
