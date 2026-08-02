import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductBarcode } from './entities/product-barcode.entity';
import { ProductImage } from './entities/product-image.entity';
import { KitComponent } from './entities/kit-component.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { ProductImagesService } from './product-images.service';
import { ProductImagesController } from './product-images.controller';
import { KitComponentsService } from './kit-components.service';
import { KitComponentsController } from './kit-components.controller';
import { BarcodesService } from './barcodes.service';
import { AttributesModule } from '../catalog/attributes/attributes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      VariantAttributeValue,
      ProductAttributeValue,
      ProductBarcode,
      ProductImage,
      KitComponent,
    ]),
    AttributesModule,
  ],
  controllers: [
    ProductsController,
    ProductVariantsController,
    ProductImagesController,
    KitComponentsController,
  ],
  providers: [
    ProductsService,
    ProductVariantsService,
    ProductImagesService,
    KitComponentsService,
    BarcodesService,
  ],
  exports: [ProductsService, ProductVariantsService, TypeOrmModule],
})
export class ProductsModule {}
