import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CustomerSource {
  POS = 'pos',
  ECOMMERCE = 'ecommerce',
}

export enum DocType {
  CC = 'CC',
  NIT = 'NIT',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
}

@Entity('customers')
export class Customer extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: DocType, nullable: true })
  docType: DocType | null;

  @Column({ name: 'docNumber', type: 'varchar', nullable: true })
  docNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'enum', enum: CustomerSource, default: CustomerSource.POS })
  source: CustomerSource;

  @Column({ name: 'hasAccount', default: false })
  hasAccount: boolean;

  @Column({ name: 'passwordHash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ name: 'defaultPriceListId', type: 'uuid', nullable: true })
  defaultPriceListId: string | null;

  @Column({ name: 'loyaltyPoints', type: 'int', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  balance: number;

  @Column({ default: true })
  active: boolean;
}
