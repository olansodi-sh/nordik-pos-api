import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ProductVariantsService } from './product-variants.service';
import { BarcodesService } from './barcodes.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Controller('products/:productId/variants')
export class ProductVariantsController {
  constructor(
    private readonly variantsService: ProductVariantsService,
    private readonly barcodesService: BarcodesService,
  ) {}

  @RequirePermissions('catalog.read')
  @Get()
  findAll(@Param('productId') productId: string) {
    return this.variantsService.findByProduct(productId);
  }

  @RequirePermissions('catalog.read')
  @Get(':variantId')
  findOne(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.variantsService.findOneOrFail(productId, variantId);
  }

  @RequirePermissions('catalog.read')
  @Get(':variantId/attributes')
  findAttributes(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.variantsService.findAttributeValues(productId, variantId);
  }

  @RequirePermissions('catalog.read')
  @Get(':variantId/barcodes')
  findBarcodes(@Param('variantId') variantId: string) {
    return this.barcodesService.findByProductOrVariant({ variantId });
  }

  @RequirePermissions('catalog.write')
  @Post()
  create(@Param('productId') productId: string, @Body() dto: CreateVariantDto) {
    return this.variantsService.create(productId, dto);
  }

  @RequirePermissions('catalog.write')
  @Patch(':variantId')
  update(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantsService.update(productId, variantId, dto);
  }

  @RequirePermissions('catalog.write')
  @Delete(':variantId')
  remove(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.variantsService.remove(productId, variantId);
  }
}
