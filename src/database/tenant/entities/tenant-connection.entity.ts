import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../../modules/businesses/entities/business.entity';

export enum TenantConnectionStatus {
  PROVISIONING = 'provisioning',
  READY = 'ready',
  FAILED = 'failed',
}

/**
 * Ubicación física de la base de datos de un inquilino (mismo servidor
 * Postgres, una base de datos distinta por empresa). Se guarda aparte de
 * Business para aislar credenciales/estado de aprovisionamiento del perfil
 * del negocio.
 */
@Entity('tenant_connections')
export class TenantConnection extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'businessId', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column({ name: 'databaseName' })
  databaseName: string;

  @Column()
  username: string;

  @Column({ name: 'encryptedPassword' })
  encryptedPassword: string;

  @Column({
    type: 'enum',
    enum: TenantConnectionStatus,
    default: TenantConnectionStatus.PROVISIONING,
  })
  status: TenantConnectionStatus;
}
