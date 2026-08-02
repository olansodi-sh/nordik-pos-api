import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { ProductsService } from './products.service';
import { AttributeDefinitionsService } from '../catalog/attributes/attribute-definitions.service';
import { BarcodesService } from './barcodes.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { TenantContext } from '../../common/tenant/tenant-context';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantsRepository: Repository<ProductVariant>,
    @InjectRepository(VariantAttributeValue)
    private readonly attributeValuesRepository: Repository<VariantAttributeValue>,
    private readonly productsService: ProductsService,
    private readonly attributeDefinitionsService: AttributeDefinitionsService,
    private readonly barcodesService: BarcodesService,
    private readonly tenantContext: TenantContext,
  ) {}

  async findByProduct(productId: string): Promise<ProductVariant[]> {
    await this.productsService.findOneOrFail(productId);
    return this.variantsRepository.find({ where: { productId } });
  }

  async findOneOrFail(
    productId: string,
    variantId: string,
  ): Promise<ProductVariant> {
    await this.productsService.findOneOrFail(productId);
    const variant = await this.variantsRepository.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }
    return variant;
  }

  /**
   * Busca una variante solo por su id, sin conocer de antemano el producto
   * dueño (ej. desde `stock`, que solo referencia variantId). Verifica el
   * tenant vía el negocio del producto padre.
   */
  async findVariantByIdOrFail(variantId: string): Promise<ProductVariant> {
    const variant = await this.variantsRepository.findOne({
      where: { id: variantId },
      relations: { product: true },
    });
    if (
      !variant ||
      variant.product.businessId !== this.tenantContext.businessId
    ) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }
    return variant;
  }

  async create(
    productId: string,
    dto: CreateVariantDto,
  ): Promise<ProductVariant> {
    const product = await this.productsService.findOneOrFail(productId);
    if (!product.hasVariants) {
      throw new BadRequestException(
        'Este producto no maneja variantes (hasVariants = false)',
      );
    }

    const variant = await this.variantsRepository.save(
      this.variantsRepository.create({
        productId,
        cost: dto.cost ?? 0,
        listPrice: dto.listPrice ?? null,
        discountPercent: dto.discountPercent ?? 0,
      }),
    );

    if (dto.attributes?.length) {
      await this.saveAttributeValues(variant.id, dto.attributes);
    }

    await this.barcodesService.createBarcode({
      variantId: variant.id,
      code: dto.barcode,
    });

    return variant;
  }

  async update(
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.findOneOrFail(productId, variantId);
    const { attributes, ...rest } = dto;
    Object.assign(variant, rest);
    const saved = await this.variantsRepository.save(variant);

    if (attributes?.length) {
      await this.saveAttributeValues(variantId, attributes);
    }

    return saved;
  }

  async remove(productId: string, variantId: string): Promise<void> {
    const variant = await this.findOneOrFail(productId, variantId);
    await this.variantsRepository.softRemove(variant);
  }

  async findAttributeValues(
    productId: string,
    variantId: string,
  ): Promise<VariantAttributeValue[]> {
    await this.findOneOrFail(productId, variantId);
    return this.attributeValuesRepository.find({
      where: { variantId },
      relations: { attributeDefinition: true },
    });
  }

  private async saveAttributeValues(
    variantId: string,
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
          variantId,
          attributeDefinitionId,
          value,
        }),
      ),
    );
  }
}
