import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { ProductBarcode } from './entities/product-barcode.entity';
import { generateInternalBarcode } from './utils/barcode-generator.util';

const POSTGRES_UNIQUE_VIOLATION = '23505';
const MAX_BARCODE_ATTEMPTS = 3;

@Injectable()
export class BarcodesService {
  constructor(
    @InjectRepository(ProductBarcode)
    private readonly barcodesRepository: Repository<ProductBarcode>,
    private readonly tenantContext: TenantContext,
  ) {}

  /**
   * Crea el código de barras principal de un producto. Si no se provee uno,
   * genera uno interno y reintenta ante una colisión de unicidad (poco
   * probable, pero posible).
   */
  async createBarcode(params: {
    productId: string;
    code?: string;
  }): Promise<ProductBarcode> {
    if (params.code) {
      return this.barcodesRepository.save(
        this.barcodesRepository.create({
          productId: params.productId,
          code: params.code,
          isPrimary: true,
        }),
      );
    }

    for (let attempt = 0; attempt < MAX_BARCODE_ATTEMPTS; attempt++) {
      try {
        return await this.barcodesRepository.save(
          this.barcodesRepository.create({
            productId: params.productId,
            code: generateInternalBarcode(),
            isPrimary: true,
          }),
        );
      } catch (error) {
        if (
          !this.isUniqueViolation(error) ||
          attempt === MAX_BARCODE_ATTEMPTS - 1
        ) {
          throw error;
        }
      }
    }

    throw new ConflictException('No se pudo generar un código de barras único');
  }

  findByProduct(productId: string) {
    return this.barcodesRepository.find({ where: { productId } });
  }

  /** Búsqueda por código para el punto de venta (escáner/lector). */
  async findByCode(code: string): Promise<ProductBarcode> {
    const barcode = await this.barcodesRepository.findOne({
      where: { code },
      relations: { product: true },
    });

    if (!barcode) {
      throw new NotFoundException(
        `No se encontró ningún producto con el código "${code}"`,
      );
    }

    return barcode;
  }

  isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as unknown as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
