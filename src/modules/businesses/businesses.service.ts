import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
  ) {}

  async create(name: string, taxId?: string): Promise<Business> {
    const business = this.businessesRepository.create({
      name,
      taxId: taxId ?? null,
    });
    return this.businessesRepository.save(business);
  }

  async findById(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({ where: { id } });
    if (!business) {
      throw new NotFoundException(`Business ${id} not found`);
    }
    return business;
  }
}
