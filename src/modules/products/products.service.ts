import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BarcodesService } from './barcodes.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { CustomizableEntityType } from '../custom-fields/entities/custom-field-definition.entity';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProductsService extends TenantScopedService<Product> {
  constructor(
    @InjectRepository(Product) repository: Repository<Product>,
    private readonly barcodesService: BarcodesService,
    private readonly customFieldsService: CustomFieldsService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const customFields = await this.customFieldsService.validate(
      CustomizableEntityType.PRODUCT,
      dto.customFields,
    );

    const product = await this.create({
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? null,
      categoryId: dto.categoryId ?? null,
      brandId: dto.brandId ?? null,
      unit: dto.unit ?? 'unidad',
      tracksInventory: dto.tracksInventory ?? true,
      customFields,
    }).catch((error) => {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `Ya existe un producto con el SKU "${dto.sku}"`,
        );
      }
      throw error;
    });

    await this.barcodesService.createBarcode({
      productId: product.id,
      code: dto.barcode,
    });

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const { customFields: customFieldsInput, ...rest } = dto;

    const patch: Partial<Product> = { ...rest };
    if (customFieldsInput !== undefined) {
      patch.customFields = await this.customFieldsService.validate(
        CustomizableEntityType.PRODUCT,
        customFieldsInput,
      );
    }

    return this.update(id, patch).catch((error) => {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `Ya existe un producto con el SKU "${dto.sku}"`,
        );
      }
      throw error;
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as unknown as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
