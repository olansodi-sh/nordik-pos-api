import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InvoicingStatus,
  SaleElectronicInvoice,
} from './entities/sale-electronic-invoice.entity';
import { InvoicingProvider } from './entities/business-invoicing-settings.entity';
import { BusinessInvoicingSettingsService } from './business-invoicing-settings.service';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class SaleElectronicInvoicesService {
  constructor(
    @InjectRepository(SaleElectronicInvoice)
    private readonly repository: Repository<SaleElectronicInvoice>,
    private readonly settingsService: BusinessInvoicingSettingsService,
    private readonly salesService: SalesService,
  ) {}

  findBySale(saleId: string): Promise<SaleElectronicInvoice | null> {
    return this.repository.findOne({ where: { saleId } });
  }

  async emit(saleId: string): Promise<SaleElectronicInvoice> {
    const settings = await this.settingsService.get();
    if (
      !settings.electronicInvoicingEnabled ||
      settings.provider === InvoicingProvider.NONE
    ) {
      throw new BadRequestException(
        'La facturación electrónica no está activada para este negocio',
      );
    }

    await this.salesService.findOneOrFail(saleId);

    const existing = await this.repository.findOne({ where: { saleId } });
    if (existing) {
      throw new BadRequestException(
        'Esta venta ya tiene una factura electrónica emitida',
      );
    }

    let invoice = await this.repository.save(
      this.repository.create({
        saleId,
        provider: settings.provider,
        status: InvoicingStatus.PENDING,
        attempts: 1,
      }),
    );

    try {
      const result = await this.issueWithProvider(settings.provider, saleId);
      invoice.status = result.status;
      invoice.externalId = result.externalId;
    } catch (error) {
      invoice.status = InvoicingStatus.ERROR;
      invoice.errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
    }

    invoice = await this.repository.save(invoice);
    return invoice;
  }

  /**
   * Placeholder de integración: aún no hay conexión real con un proveedor
   * (se evaluará Amovil, ver notas del proyecto). Simula una emisión
   * exitosa para poder probar el flujo completo de la venta sin bloquear
   * el resto del sistema en la integración real.
   */
  private issueWithProvider(
    provider: InvoicingProvider,
    saleId: string,
  ): Promise<{ status: InvoicingStatus; externalId: string }> {
    if (provider === InvoicingProvider.AMOVIL) {
      return Promise.resolve({
        status: InvoicingStatus.SENT,
        externalId: `STUB-${saleId.slice(0, 8).toUpperCase()}`,
      });
    }
    return Promise.reject(
      new NotFoundException(
        `Proveedor de facturación "${provider}" no implementado`,
      ),
    );
  }
}
