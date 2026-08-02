import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { TenantContext } from '../../common/tenant/tenant-context';
import { TenantScopedService } from '../../common/tenant/tenant-scoped.service';
import { Product } from './entities/product.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AttributeDefinitionsService } from '../catalog/attributes/attribute-definitions.service';
import { BarcodesService } from './barcodes.service';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProductsService extends TenantScopedService<Product> {
  constructor(
    @InjectRepository(Product) repository: Repository<Product>,
    @InjectRepository(ProductAttributeValue)
    private readonly attributeValuesRepository: Repository<ProductAttributeValue>,
    private readonly attributeDefinitionsService: AttributeDefinitionsService,
    private readonly barcodesService: BarcodesService,
    tenantContext: TenantContext,
  ) {
    super(repository, tenantContext);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const product = await this.create({
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? null,
      categoryId: dto.categoryId ?? null,
      brandId: dto.brandId ?? null,
      unit: dto.unit ?? 'unidad',
      tracksInventory: dto.tracksInventory ?? true,
      hasVariants: dto.hasVariants ?? false,
    }).catch((error) => {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `Ya existe un producto con el SKU "${dto.sku}"`,
        );
      }
      throw error;
    });

    if (dto.attributes?.length) {
      await this.saveAttributeValues(product.id, dto.attributes);
    }

    if (!product.hasVariants) {
      await this.barcodesService.createBarcode({
        productId: product.id,
        code: dto.barcode,
      });
    }

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const { attributes, ...rest } = dto;

    const updated = await this.update(id, rest).catch((error) => {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          `Ya existe un producto con el SKU "${dto.sku}"`,
        );
      }
      throw error;
    });

    if (attributes?.length) {
      await this.saveAttributeValues(id, attributes);
    }

    return updated;
  }

  async findAttributeValues(
    productId: string,
  ): Promise<ProductAttributeValue[]> {
    await this.findOneOrFail(productId);
    return this.attributeValuesRepository.find({
      where: { productId },
      relations: { attributeDefinition: true },
    });
  }

  private async saveAttributeValues(
    productId: string,
    values: { attributeDefinitionId: string; value: string }[],
  ): Promise<void> {
    for (const { attributeDefinitionId } of values) {
      await this.attributeDefinitionsService.findOneOrFail(
        attributeDefinitionId,
      );
    }

    await this.attributeValuesRepository.save(
      values.map(({ attributeDefinitionId, value }) =>
        this.attributeValuesRepository.create({
          productId,
          attributeDefinitionId,
          value,
        }),
      ),
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as unknown as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
