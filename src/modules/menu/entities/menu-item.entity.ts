import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Registro central de pantallas/menús (BD central): reemplaza el árbol
 * hardcodeado en el frontend (DRAWER_NAV) como fuente de verdad para saber
 * qué existe — la visibilidad real por usuario la decide MenuAccessRule.
 * Árbol autorreferenciado: los grupos tienen parentId null y path null; las
 * hojas cuelgan de un grupo y sí tienen path.
 */
@Entity('menu_items')
export class MenuItem extends BaseEntity {
  @Index({ unique: true })
  @Column()
  key: string;

  @Column()
  label: string;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', nullable: true })
  path: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => MenuItem, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: MenuItem | null;

  @Column({ default: 0 })
  sortOrder: number;

  // Bandera dura, fuera de MenuAccessRule a propósito: así una regla de un
  // admin de tenant nunca puede exponer pantallas cross-tenant (ej.
  // "Empresas") a un usuario que no es superadministrador.
  @Column({ default: false })
  superAdminOnly: boolean;

  @Column({ default: true })
  active: boolean;
}
