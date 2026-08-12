import { MigrationInterface, QueryRunner } from 'typeorm';

// Fase 4: tablas del registro de menú y las reglas de visibilidad por
// membresía (BD central). El árbol de MenuItem se siembra solo, en
// MenuService.onModuleInit() — esta migración solo crea las tablas vacías.
export class MenuTables1786172000000 implements MigrationInterface {
  name = 'MenuTables1786172000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."menu_access_rules_effect_enum" AS ENUM('allow', 'deny');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "key" character varying NOT NULL,
        "label" character varying NOT NULL,
        "icon" character varying,
        "path" character varying,
        "parentId" uuid,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "superAdminOnly" boolean NOT NULL DEFAULT false,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_menu_item_key" UNIQUE ("key"),
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_menu_item_parentId" ON "menu_items" ("parentId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ADD CONSTRAINT "FK_menu_item_parent" FOREIGN KEY ("parentId") REFERENCES "menu_items"("id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_access_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "membershipId" uuid NOT NULL,
        "menuItemId" uuid NOT NULL,
        "effect" "public"."menu_access_rules_effect_enum" NOT NULL,
        CONSTRAINT "uq_menu_access_membership_item" UNIQUE ("membershipId", "menuItemId"),
        CONSTRAINT "PK_menu_access_rules" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_menu_access_membershipId" ON "menu_access_rules" ("membershipId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "menu_access_rules"
      ADD CONSTRAINT "FK_menu_access_membership" FOREIGN KEY ("membershipId") REFERENCES "user_tenant_memberships"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_access_rules"
      ADD CONSTRAINT "FK_menu_access_item" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_access_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."menu_access_rules_effect_enum"`);
  }
}
