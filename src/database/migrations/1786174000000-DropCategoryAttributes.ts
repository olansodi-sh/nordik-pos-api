import { MigrationInterface, QueryRunner } from 'typeorm';

// El sistema de atributos por categoría se reemplaza por Custom Fields
// (ver AddProductToCustomFieldEntityType / AddCustomFieldsToProducts): las
// propiedades de producto ya no se atan a una categoría. Sin datos que
// preservar (confirmado por el negocio), se elimina el esquema completo.
export class DropCategoryAttributes1786174000000 implements MigrationInterface {
  name = 'DropCategoryAttributes1786174000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "variant_attribute_values" DROP CONSTRAINT IF EXISTS "FK_09d0838d716add8a270dd83afef"`);
    await queryRunner.query(`ALTER TABLE "variant_attribute_values" DROP CONSTRAINT IF EXISTS "FK_7c0b50714d82aca370fe83658e2"`);
    await queryRunner.query(`ALTER TABLE "product_attribute_values" DROP CONSTRAINT IF EXISTS "FK_6d5587f03f3bb31263dd34f1d57"`);
    await queryRunner.query(`ALTER TABLE "product_attribute_values" DROP CONSTRAINT IF EXISTS "FK_6f387b01fd9800591fa425dd203"`);
    await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT IF EXISTS "FK_edf58ec4a86bd8aa346a560f9a6"`);
    await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT IF EXISTS "FK_38209e8493459f8b98aa107be2b"`);
    await queryRunner.query(`ALTER TABLE "attribute_definitions" DROP CONSTRAINT IF EXISTS "FK_ac91cbc758b0ba5988a35c631e8"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "variant_attribute_values"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_attribute_values"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "category_attributes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attribute_definitions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."attribute_definitions_type_enum"`);
  }

  public async down(): Promise<void> {
    // No reversible: el negocio confirmó que no había datos que preservar
    // al momento de eliminar el esquema. Restaurar la tabla desde una
    // migración anterior requeriría recuperar un backup.
    throw new Error(
      'DropCategoryAttributes no es reversible — restaurar desde backup si es necesario.',
    );
  }
}
