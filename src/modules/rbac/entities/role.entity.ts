import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

// No usa ManyToMany a Permission: desde que las bases de datos son
// físicamente independientes por inquilino, una FK cruzando bases de datos
// no es posible — los códigos de permiso (el único dato realmente invariante)
// se guardan directamente como array de texto.
@Entity('roles')
@Unique('uq_role_name', ['name'])
export class Role extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ name: 'permissionCodes', type: 'text', array: true, default: () => "'{}'" })
  permissionCodes: string[];
}
