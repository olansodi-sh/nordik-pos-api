import { MigrationInterface, QueryRunner } from 'typeorm';

// Fase 3: introduce las membresías usuario-empresa (BD central). Crea la
// tabla, la siembra a partir de los datos actuales de "users" (que hasta
// ahora tenía businessId/roleId propios, 1:1), y afloja el NOT NULL de
// users.businessId — la columna se conserva como dato histórico inerte,
// pero ya no la puebla la aplicación (el usuario vive una sola vez en la BD
// central; su relación con cada negocio ahora vive en la membresía).
export class UserTenantMemberships1786170000000 implements MigrationInterface {
  name = 'UserTenantMemberships1786170000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."user_tenant_memberships_status_enum" AS ENUM('active', 'suspended');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_tenant_memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid NOT NULL,
        "businessId" uuid NOT NULL,
        "roleId" uuid,
        "status" "public"."user_tenant_memberships_status_enum" NOT NULL DEFAULT 'active',
        "isDefault" boolean NOT NULL DEFAULT false,
        CONSTRAINT "uq_membership_user_business" UNIQUE ("userId", "businessId"),
        CONSTRAINT "PK_user_tenant_memberships" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_membership_userId" ON "user_tenant_memberships" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_membership_businessId" ON "user_tenant_memberships" ("businessId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_tenant_memberships"
      ADD CONSTRAINT "FK_membership_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "user_tenant_memberships"
      ADD CONSTRAINT "FK_membership_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
    `);

    // Backfill: una membresía por usuario existente, a partir de su
    // businessId/roleId de hoy. Esta misma migración también corre contra
    // cada BD de inquilino (comparte carpeta de migraciones con la central) —
    // ahí "users"/"businesses" son copias legacy de la Fase 2 (la tabla
    // "businesses" quedó vacía a propósito, nunca se copió), así que el JOIN
    // contra businesses hace que el INSERT no inserte nada ahí, en vez de
    // fallar por violar la FK.
    await queryRunner.query(`
      INSERT INTO "user_tenant_memberships" ("userId", "businessId", "roleId", "status", "isDefault")
      SELECT u.id, u."businessId", u."roleId", 'active', true
      FROM "users" u
      INNER JOIN "businesses" b ON b.id = u."businessId"
      ON CONFLICT ("userId", "businessId") DO NOTHING
    `);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "businessId" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "businessId" SET NOT NULL`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_tenant_memberships"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_tenant_memberships_status_enum"`);
  }
}
