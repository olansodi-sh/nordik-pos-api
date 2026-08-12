import { MigrationInterface, QueryRunner } from 'typeorm';

// Se me quedó fuera de DropBusinessIdNotNull1786169000000: "roles" también
// tenía businessId NOT NULL heredado de TenantBaseEntity, y Role ya no la
// declara (ver 1786165000000-RolePermissionCodes.ts). Bloqueaba crear roles
// nuevos (ej. al aprovisionar un inquilino nuevo).
export class RolesBusinessIdNullable1786171000000 implements MigrationInterface {
  name = 'RolesBusinessIdNullable1786171000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'roles' AND column_name = 'businessId'
        ) THEN
          ALTER TABLE "roles" ALTER COLUMN "businessId" DROP NOT NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'roles' AND column_name = 'businessId'
        ) THEN
          ALTER TABLE "roles" ALTER COLUMN "businessId" SET NOT NULL;
        END IF;
      END $$;
    `);
  }
}
