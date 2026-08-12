import { Module } from '@nestjs/common';
import { TenantOrmModule } from '../../database/tenant/tenant-orm.module';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
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
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [
    TenantOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductBarcode,
      ProductImage,
      KitComponent,
    ]),
    CustomFieldsModule,
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
  exports: [ProductsService, ProductVariantsService, TenantOrmModule],
})
export class ProductsModule {}
