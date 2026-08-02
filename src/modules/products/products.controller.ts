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
import { ProductsService } from './products.service';
import { BarcodesService } from './barcodes.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly barcodesService: BarcodesService,
  ) {}

  @RequirePermissions('catalog.read')
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @RequirePermissions('catalog.read')
  @Get('barcode-lookup/:code')
  findByBarcode(@Param('code') code: string) {
    return this.barcodesService.findByCode(code);
  }

  @RequirePermissions('catalog.read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOneOrFail(id);
  }

  @RequirePermissions('catalog.read')
  @Get(':id/attributes')
  findAttributes(@Param('id') id: string) {
    return this.productsService.findAttributeValues(id);
  }

  @RequirePermissions('catalog.read')
  @Get(':id/barcodes')
  findBarcodes(@Param('id') id: string) {
    return this.barcodesService.findByProductOrVariant({ productId: id });
  }

  @RequirePermissions('catalog.write')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @RequirePermissions('catalog.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.updateProduct(id, dto);
  }

  @RequirePermissions('catalog.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
