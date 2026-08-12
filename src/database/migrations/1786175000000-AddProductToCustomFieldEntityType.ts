import { MigrationInterface, QueryRunner } from 'typeorm';

// Custom Fields deja de ser exclusivo de Sale: ahora también aplica a
// Product (ver AddCustomFieldsToProducts, siguiente migración). Postgres no
// permite usar un valor de enum agregado con ADD VALUE dentro de la misma
// transacción en la que se agrega, por eso va en su propia migración.
export class AddProductToCustomFieldEntityType1786175000000
  implements MigrationInterface
{
  name = 'AddProductToCustomFieldEntityType1786175000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."custom_field_definitions_entitytype_enum" ADD VALUE IF NOT EXISTS 'product';
    `);
  }

  public async down(): Promise<void> {
    // Postgres no soporta DROP VALUE en un enum. Si hace falta revertir,
    // hay que recrear el tipo sin 'product' y migrar la columna a mano.
  }
}
