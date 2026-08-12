import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Warehouse } from '../../inventory/warehouses/entities/warehouse.entity';

@Entity('cash_registers')
export class CashRegister extends BaseEntity {
  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;
}
