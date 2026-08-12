import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';

export enum StockMovementType {
  INITIAL = 'initial',
  SALE = 'sale',
  SALE_VOID = 'sale_void',
  PURCHASE = 'purchase',
  CREDIT_NOTE_RESTOCK = 'credit_note_restock',
  ADJUSTMENT_SET = 'adjustment_set',
  ADJUSTMENT_ADD = 'adjustment_add',
  COUNT = 'count',
}

// No extiende TenantBaseEntity: se consulta muy seguido por rango de fechas
// y se prefiere businessId como columna simple indexada en vez de relación.
@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @Index()
  @Column({ name: 'businessId', type: 'uuid' })
  businessId: string;

  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @Index()
  @Column({ name: 'warehouseId', type: 'uuid' })
  warehouseId: string;

  @Column({ name: 'quantityDelta', type: 'numeric', precision: 14, scale: 2 })
  quantityDelta: number;

  @Column({ name: 'quantityAfter', type: 'numeric', precision: 14, scale: 2 })
  quantityAfter: number;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ name: 'refType', type: 'varchar', nullable: true })
  refType: string | null;

  @Column({ name: 'refId', type: 'uuid', nullable: true })
  refId: string | null;

  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'timestamptz' })
  date: Date;
}
