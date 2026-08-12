import { MigrationInterface, QueryRunner } from 'typeorm';

// Columna de valores de Custom Fields para Product, igual patrón que
// Sale.customFields (ver CustomFields1786173000000).
export class AddCustomFieldsToProducts1786176000000
  implements MigrationInterface
{
  name = 'AddCustomFieldsToProducts1786176000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customFields" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "customFields"`,
    );
  }
}
