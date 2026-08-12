import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

export enum BarcodeType {
  EAN13 = 'ean13',
  UPC = 'upc',
  INTERNAL = 'internal',
  QR = 'qr',
}

@Entity('product_barcodes')
export class ProductBarcode extends BaseEntity {
  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: BarcodeType, default: BarcodeType.INTERNAL })
  type: BarcodeType;

  @Column({ name: 'isPrimary', default: true })
  isPrimary: boolean;
}
