import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MembershipStatus,
  UserTenantMembership,
} from './entities/user-tenant-membership.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(UserTenantMembership)
    private readonly repository: Repository<UserTenantMembership>,
  ) {}

  findActiveForUser(userId: string): Promise<UserTenantMembership[]> {
    return this.repository.find({
      where: { userId, status: MembershipStatus.ACTIVE },
      relations: { business: true },
      order: { isDefault: 'DESC' },
    });
  }

  findActive(userId: string, businessId: string): Promise<UserTenantMembership | null> {
    return this.repository.findOne({
      where: { userId, businessId, status: MembershipStatus.ACTIVE },
    });
  }

  findForUserAndBusiness(
    userId: string,
    businessId: string,
  ): Promise<UserTenantMembership | null> {
    return this.repository.findOne({ where: { userId, businessId } });
  }

  findAllForBusiness(businessId: string): Promise<UserTenantMembership[]> {
    return this.repository.find({
      where: { businessId },
      relations: { user: true },
    });
  }

  /**
   * Crea (o reactiva) la membresía de un usuario a un negocio. Si ya tenía
   * una membresía inactiva para ese negocio, la reactiva con el rol nuevo en
   * vez de crear una fila duplicada (violaría la unicidad userId+businessId).
   */
  async createOrReactivate(params: {
    userId: string;
    businessId: string;
    roleId: string | null;
    isDefault: boolean;
  }): Promise<UserTenantMembership> {
    const existing = await this.findForUserAndBusiness(params.userId, params.businessId);
    if (existing) {
      existing.roleId = params.roleId;
      existing.status = MembershipStatus.ACTIVE;
      if (params.isDefault) existing.isDefault = true;
      return this.repository.save(existing);
    }
    const membership = this.repository.create({
      userId: params.userId,
      businessId: params.businessId,
      roleId: params.roleId,
      status: MembershipStatus.ACTIVE,
      isDefault: params.isDefault,
    });
    return this.repository.save(membership);
  }

  async updateForBusiness(
    businessId: string,
    userId: string,
    data: { roleId?: string | null; status?: MembershipStatus },
  ): Promise<UserTenantMembership> {
    const membership = await this.findForUserAndBusiness(userId, businessId);
    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada`);
    }
    if (data.roleId !== undefined) membership.roleId = data.roleId;
    if (data.status !== undefined) membership.status = data.status;
    return this.repository.save(membership);
  }

  async removeForBusiness(businessId: string, userId: string): Promise<void> {
    const membership = await this.findForUserAndBusiness(userId, businessId);
    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada`);
    }
    await this.repository.softRemove(membership);
  }
}
