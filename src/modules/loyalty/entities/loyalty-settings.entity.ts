import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('loyalty_settings')
export class LoyaltySettings {
  @PrimaryColumn({ name: 'businessId', type: 'uuid' })
  businessId: string;

  @Column({
    name: 'pointsPerAmount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  pointsPerAmount: number;

  @Column({
    name: 'amountUnit',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 1000,
  })
  amountUnit: number;

  @Column({ default: false })
  enabled: boolean;
}
