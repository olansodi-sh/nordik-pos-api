import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

export enum BarcodeType {
  EAN13 = 'ean13',
  UPC = 'upc',
  INTERNAL = 'internal',
  QR = 'qr',
}

@Entity('product_barcodes')
@Check(
  'chk_barcode_owner',
  `("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL)`,
)
export class ProductBarcode extends BaseEntity {
  @Column({ name: 'variantId', type: 'uuid', nullable: true })
  variantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @Column({ name: 'productId', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: BarcodeType, default: BarcodeType.INTERNAL })
  type: BarcodeType;

  @Column({ name: 'isPrimary', default: true })
  isPrimary: boolean;
}
