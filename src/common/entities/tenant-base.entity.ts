import { Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from '../../modules/businesses/entities/business.entity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Index()
  @Column({ name: 'businessId', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}
