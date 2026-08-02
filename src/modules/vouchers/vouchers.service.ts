import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';
import { Voucher, VoucherStatus } from './entities/voucher.entity';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';

@Injectable()
export class VouchersService extends TenantScopedService<Voucher> {
  constructor(
    @InjectRepository(Voucher) repository: Repository<Voucher>,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  createVoucher(dto: CreateVoucherDto): Promise<Voucher> {
    return this.create({
      code: generateDocumentNumber('VL'),
      customerId: dto.customerId ?? null,
      amount: dto.amount,
      balance: dto.amount,
      reason: dto.reason ?? null,
      expiresAt: dto.expiresAt ?? null,
    });
  }

  async findByCode(code: string): Promise<Voucher> {
    const voucher = await this.repository.findOne({
      where: { code, businessId: this.tenantContext.businessId },
    });
    if (!voucher) {
      throw new NotFoundException(`Voucher ${code} not found`);
    }
    return voucher;
  }

  async redeem(id: string, dto: RedeemVoucherDto): Promise<Voucher> {
    const voucher = await this.findOneOrFail(id);

    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException('Este vale no está activo');
    }
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      voucher.status = VoucherStatus.EXPIRED;
      await this.repository.save(voucher);
      throw new BadRequestException('Este vale está expirado');
    }
    if (dto.amount > Number(voucher.balance)) {
      throw new BadRequestException(
        'El monto excede el saldo disponible del vale',
      );
    }

    voucher.balance = Number(voucher.balance) - dto.amount;
    if (voucher.balance <= 0) {
      voucher.status = VoucherStatus.REDEEMED;
    }

    return this.repository.save(voucher);
  }
}
