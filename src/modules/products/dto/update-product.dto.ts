import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// hasVariants y barcode no se editan por este endpoint: cambiar hasVariants
// después de creado el producto rompería la consistencia con variantes/stock
// ya existentes; el código de barras tiene su propio endpoint dedicado.
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['hasVariants', 'barcode'] as const),
) {}
