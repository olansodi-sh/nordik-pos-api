import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolePermissionCodes1786165000000 implements MigrationInterface {
  name = 'RolePermissionCodes1786165000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "permissionCodes" text[] NOT NULL DEFAULT '{}'`,
    );
    // La unicidad de nombre de rol pasa a ser por BD física (ya aislada por
    // inquilino), no por columna businessId — que dejó de existir en la
    // entidad Role (se conserva físicamente como dato histórico inerte).
    // La BD central legacy puede tener nombres repetidos entre negocios
    // distintos (ej. "Admin" x N) — en ese caso se omite la restricción en
    // vez de fallar el arranque de la app.
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "uq_role_business_name"`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT name FROM "roles" GROUP BY name HAVING count(*) > 1)
        THEN
          ALTER TABLE "roles" ADD CONSTRAINT "uq_role_name" UNIQUE ("name");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "uq_role_name"`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "uq_role_business_name" UNIQUE ("businessId", name)`,
    );
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN IF EXISTS "permissionCodes"`);
  }
}
