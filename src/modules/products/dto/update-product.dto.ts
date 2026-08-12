import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// barcode no se edita por este endpoint: tiene su propio endpoint dedicado.
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['barcode'] as const),
) {}
