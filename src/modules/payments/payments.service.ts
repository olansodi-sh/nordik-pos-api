import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Payment, PaymentMethod } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import {
  CashMovement,
  CashMovementType,
} from '../cash/entities/cash-movement.entity';
import {
  CashSession,
  CashSessionStatus,
} from '../cash/entities/cash-session.entity';

@Injectable()
export class PaymentsService extends TenantScopedService<Payment> {
  constructor(
    @InjectRepository(Payment) repository: Repository<Payment>,
    @InjectRepository(PaymentAllocation)
    private readonly allocationsRepository: Repository<PaymentAllocation>,
    private readonly dataSource: DataSource,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async findAllocations(paymentId: string): Promise<PaymentAllocation[]> {
    await this.findOneOrFail(paymentId);
    return this.allocationsRepository.find({ where: { paymentId } });
  }

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const userId = this.tenantContext.currentUser?.userId;
    if (!userId) {
      throw new BadRequestException('No hay usuario autenticado');
    }

    if (!dto.allocations.length) {
      throw new BadRequestException(
        'El pago debe aplicarse al menos a una venta',
      );
    }

    const allocatedTotal = dto.allocations.reduce(
      (sum, a) => sum + a.amount,
      0,
    );
    if (allocatedTotal > dto.amount) {
      throw new BadRequestException(
        'La suma de las aplicaciones no puede superar el monto del pago',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const allocationRepo = manager.getRepository(PaymentAllocation);
      const saleRepo = manager.getRepository(Sale);

      const payment = await paymentRepo.save(
        paymentRepo.create({
          businessId: this.tenantContext.businessId,
          customerId: dto.customerId ?? null,
          method: dto.method,
          amount: dto.amount,
          userId,
          cashSessionId: dto.cashSessionId ?? null,
          date: new Date(),
        }),
      );

      for (const allocation of dto.allocations) {
        const sale = await saleRepo.findOne({
          where: {
            id: allocation.saleId,
            businessId: this.tenantContext.businessId,
          },
        });
        if (!sale) {
          throw new BadRequestException(
            `Venta ${allocation.saleId} no encontrada`,
          );
        }

        const newPaidAmount = Number(sale.paidAmount) + allocation.amount;
        if (newPaidAmount > Number(sale.total) + 0.01) {
          throw new BadRequestException(
            `El pago excede el saldo pendiente de la venta ${sale.number}`,
          );
        }

        sale.paidAmount = newPaidAmount;
        sale.status =
          newPaidAmount >= Number(sale.total)
            ? SaleStatus.PAID
            : newPaidAmount > 0
              ? SaleStatus.PARTIAL
              : SaleStatus.CONFIRMED;
        await saleRepo.save(sale);

        await allocationRepo.save(
          allocationRepo.create({
            paymentId: payment.id,
            saleId: sale.id,
            amount: allocation.amount,
          }),
        );
      }

      if (dto.method === PaymentMethod.CASH && dto.cashSessionId) {
        const session = await manager.getRepository(CashSession).findOne({
          where: { id: dto.cashSessionId, status: CashSessionStatus.OPEN },
        });
        if (!session) {
          throw new BadRequestException(
            'La caja indicada no existe o no está abierta',
          );
        }

        await manager.getRepository(CashMovement).save(
          manager.getRepository(CashMovement).create({
            sessionId: dto.cashSessionId,
            type: CashMovementType.IN,
            amount: dto.amount,
            concept: 'Pago de venta',
            refType: 'payment',
            refId: payment.id,
          }),
        );
      }

      return payment;
    });
  }
}
