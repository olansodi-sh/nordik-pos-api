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

const SALT_ROUNDS = 10;

export type SafeUser = Omit<User, 'passwordHash'>;

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
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: { role: { permissions: true } },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: { permissions: true } },
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async create(data: {
    businessId: string;
    name: string;
    email: string;
    passwordHash: string;
    roleId?: string | null;
  }): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      roleId: data.roleId ?? null,
    });
    return this.usersRepository.save(user);
  }

  async findAllForBusiness(businessId: string): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      where: { businessId },
      relations: { role: true },
    });
    return users.map(stripPassword);
  }

  async findOneForBusinessOrFail(
    businessId: string,
    id: string,
  ): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { id, businessId },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    return stripPassword(user);
  }

  async createForBusiness(
    businessId: string,
    dto: CreateUserDto,
  ): Promise<SafeUser> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.create({
      businessId,
      name: dto.name,
      email: dto.email,
      passwordHash,
      roleId: dto.roleId ?? null,
    });
    return stripPassword(user);
  }

  async updateForBusiness(
    businessId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { id, businessId },
    });
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.roleId !== undefined) user.roleId = dto.roleId;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const saved = await this.usersRepository.save(user);
    return stripPassword(saved);
  }

  async removeForBusiness(businessId: string, id: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id, businessId },
    });
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    await this.usersRepository.softRemove(user);
  }
}
