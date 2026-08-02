import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { generateDocumentNumber } from '../../common/utils/document-number-generator.util';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ConvertQuoteDto } from './dto/convert-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { SalesService } from '../sales/sales.service';
import { CreateSaleLineDto } from '../sales/dto/create-sale.dto';

@Injectable()
export class QuotesService extends TenantScopedService<Quote> {
  constructor(
    @InjectRepository(Quote) repository: Repository<Quote>,
    @InjectRepository(QuoteLine)
    private readonly linesRepository: Repository<QuoteLine>,
    private readonly salesService: SalesService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async findLines(quoteId: string): Promise<QuoteLine[]> {
    await this.findOneOrFail(quoteId);
    return this.linesRepository.find({ where: { quoteId } });
  }

  async createQuote(dto: CreateQuoteDto): Promise<Quote> {
    if (!dto.lines.length) {
      throw new BadRequestException(
        'La cotización debe tener al menos una línea',
      );
    }

    let subtotal = 0;
    let totalDiscount = 0;
    for (const line of dto.lines) {
      subtotal += line.unitPrice * line.quantity;
      totalDiscount += line.discount ?? 0;
    }

    const quote = await this.create({
      number: generateDocumentNumber('CT'),
      customerId: dto.customerId ?? null,
      validUntil: dto.validUntil ?? null,
      subtotal,
      discount: totalDiscount,
      total: subtotal - totalDiscount,
    });

    await this.linesRepository.save(
      dto.lines.map((line) =>
        this.linesRepository.create({
          quoteId: quote.id,
          variantId: line.variantId ?? null,
          productId: line.productId ?? null,
          description: line.description ?? '',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.discount ?? 0,
          total: line.unitPrice * line.quantity - (line.discount ?? 0),
        }),
      ),
    );

    return quote;
  }

  updateStatus(id: string, dto: UpdateQuoteStatusDto): Promise<Quote> {
    return this.update(id, { status: dto.status });
  }

  /** Convierte la cotización en una venta real, reutilizando la lógica de precios/stock de SalesService. */
  async convertToSale(id: string, dto: ConvertQuoteDto) {
    const quote = await this.findOneOrFail(id);
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException(
        'Esta cotización ya fue convertida a venta',
      );
    }

    const lines = await this.linesRepository.find({ where: { quoteId: id } });
    const saleLines: CreateSaleLineDto[] = lines.map((line) => ({
      variantId: line.variantId ?? undefined,
      productId: line.productId ?? undefined,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      discount: Number(line.discount),
    }));

    const sale = await this.salesService.createSale({
      customerId: quote.customerId ?? undefined,
      warehouseId: dto.warehouseId,
      cashSessionId: dto.cashSessionId,
      lines: saleLines,
    });

    await this.update(id, { status: QuoteStatus.CONVERTED, saleId: sale.id });

    return sale;
  }
}
