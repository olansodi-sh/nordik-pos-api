import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum InvoicingProvider {
  NONE = 'none',
  AMOVIL = 'amovil',
}

@Entity('business_invoicing_settings')
export class BusinessInvoicingSettings {
  @PrimaryColumn({ name: 'businessId', type: 'uuid' })
  businessId: string;

  @Column({ name: 'electronicInvoicingEnabled', default: false })
  electronicInvoicingEnabled: boolean;

  @Column({
    type: 'enum',
    enum: InvoicingProvider,
    default: InvoicingProvider.NONE,
  })
  provider: InvoicingProvider;

  // Credenciales específicas del proveedor (NIT, resolución DIAN, api key...).
  // Se guardan como jsonb; cifrarlas a nivel de aplicación antes de persistir
  // es responsabilidad de una fase posterior cuando se integre un proveedor real.
  @Column({ type: 'jsonb', nullable: true })
  credentials: Record<string, string> | null;
}
