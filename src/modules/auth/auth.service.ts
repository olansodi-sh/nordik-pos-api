import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BusinessesService } from '../businesses/businesses.service';
import { RbacService } from '../rbac/rbac.service';
import { UsersService } from '../users/users.service';
import { PriceListsService } from '../pricing/price-lists.service';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './types/jwt-payload.type';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
    private readonly priceListsService: PriceListsService,
    private readonly jwtService: JwtService,
  ) {}

  async registerBusiness(data: {
    businessName: string;
    taxId?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) {
    const existing = await this.usersService.findByEmail(data.adminEmail);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const business = await this.businessesService.create(
      data.businessName,
      data.taxId,
    );
    const adminRole = await this.rbacService.seedDefaultRolesForBusiness(
      business.id,
    );
    await this.priceListsService.createDefaultForBusiness(business.id);
    const passwordHash = await bcrypt.hash(data.adminPassword, SALT_ROUNDS);

    const admin = await this.usersService.create({
      businessId: business.id,
      name: data.adminName,
      email: data.adminEmail,
      passwordHash,
      roleId: adminRole.id,
    });

    return this.buildAuthResponse(admin);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const payload: JwtPayload = { sub: user.id, businessId: user.businessId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: user.businessId,
      },
    };
  }
}
