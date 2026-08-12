import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MembershipsService } from '../memberships/memberships.service';
import { MembershipStatus } from '../memberships/entities/user-tenant-membership.entity';
import { MenuService } from '../menu/menu.service';

const SALT_ROUNDS = 10;

export type SafeUser = Omit<User, 'passwordHash'>;

export interface BusinessUser extends SafeUser {
  roleId: string | null;
  membershipStatus: MembershipStatus;
}

function stripPassword(user: User): SafeUser {
  const safe: Partial<User> = { ...user };
  delete safe.passwordHash;
  return safe as SafeUser;
}

// Nota: este servicio lo usa JwtStrategy (singleton, crítico para el arranque
// de la app) además del CRUD de usuarios por negocio. Por eso NO inyecta
// TenantContext (request-scoped) en el constructor — eso volvería a
// UsersService, y transitivamente a JwtStrategy, request-scoped, y Passport
// dejaría de registrar la estrategia "jwt" en el bootstrap (rompe toda la
// autenticación). El businessId se recibe explícito por parámetro en los
// métodos "ForBusiness".
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly membershipsService: MembershipsService,
    private readonly menuService: MenuService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  /**
   * Usuarios con una membresía (de cualquier estado) al negocio indicado.
   */
  async findAllForBusiness(businessId: string): Promise<BusinessUser[]> {
    const memberships = await this.membershipsService.findAllForBusiness(businessId);
    return memberships
      .filter((m) => m.user)
      .map((m) => ({
        ...stripPassword(m.user),
        roleId: m.roleId,
        membershipStatus: m.status,
      }));
  }

  async findOneForBusinessOrFail(
    businessId: string,
    id: string,
  ): Promise<BusinessUser> {
    const membership = await this.membershipsService.findForUserAndBusiness(id, businessId);
    if (!membership) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    const user = await this.findById(id);
    return {
      ...stripPassword(user),
      roleId: membership.roleId,
      membershipStatus: membership.status,
    };
  }

  /**
   * Crea el usuario y su membresía al negocio; si ya existe una cuenta con
   * ese email (pertenece a otro negocio), no la duplica — le agrega una
   * membresía nueva a este negocio con el rol indicado.
   */
  async createForBusiness(
    businessId: string,
    dto: CreateUserDto,
  ): Promise<BusinessUser> {
    let user = await this.findByEmail(dto.email);
    let isFirstMembership = true;

    if (user) {
      const existingMembership = await this.membershipsService.findForUserAndBusiness(
        user.id,
        businessId,
      );
      if (existingMembership && existingMembership.status === MembershipStatus.ACTIVE) {
        throw new ConflictException('Ya existe un usuario con ese email en este negocio');
      }
      const currentMemberships = await this.membershipsService.findActiveForUser(user.id);
      isFirstMembership = currentMemberships.length === 0;
    } else {
      const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
      user = await this.usersRepository.save(
        this.usersRepository.create({ name: dto.name, email: dto.email, passwordHash }),
      );
    }

    const membership = await this.membershipsService.createOrReactivate({
      userId: user.id,
      businessId,
      roleId: dto.roleId ?? null,
      isDefault: isFirstMembership,
    });
    await this.menuService.seedBaselineAccess(membership.id);

    return {
      ...stripPassword(user),
      roleId: membership.roleId,
      membershipStatus: membership.status,
    };
  }

  async updateForBusiness(
    businessId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<BusinessUser> {
    const user = await this.findById(id);

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    if (dto.name !== undefined || dto.password) {
      await this.usersRepository.save(user);
    }

    const membership = await this.membershipsService.updateForBusiness(businessId, id, {
      roleId: dto.roleId,
      status:
        dto.active === undefined
          ? undefined
          : dto.active
            ? MembershipStatus.ACTIVE
            : MembershipStatus.SUSPENDED,
    });

    return {
      ...stripPassword(user),
      roleId: membership.roleId,
      membershipStatus: membership.status,
    };
  }

  async removeForBusiness(businessId: string, id: string): Promise<void> {
    await this.membershipsService.removeForBusiness(businessId, id);
  }
}
