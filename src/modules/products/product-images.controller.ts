import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ProductImagesService } from './product-images.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';

@Controller('products/:productId/images')
export class ProductImagesController {
  constructor(private readonly imagesService: ProductImagesService) {}

  @RequirePermissions('catalog.read')
  @Get()
  findAll(@Param('productId') productId: string) {
    return this.imagesService.findByProduct(productId);
  }

  @RequirePermissions('catalog.write')
  @Post()
  add(
    @Param('productId') productId: string,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.imagesService.add(productId, dto);
  }

  @RequirePermissions('catalog.write')
  @Delete(':imageId')
  remove(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.imagesService.remove(productId, imageId);
  }
}
