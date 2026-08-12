import { MigrationInterface, QueryRunner } from 'typeorm';

// Fase 5: catálogo de campos personalizados por inquilino (BD del
// inquilino) + columna jsonb en Sale para guardar sus valores. Agregar un
// campo nuevo después de esto es solo una fila en custom_field_definitions,
// sin volver a tocar esquema.
export class CustomFields1786173000000 implements MigrationInterface {
  name = 'CustomFields1786173000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."custom_field_definitions_entitytype_enum" AS ENUM('sale');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."custom_field_definitions_type_enum" AS ENUM('text', 'number', 'boolean', 'date', 'select');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "custom_field_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "entityType" "public"."custom_field_definitions_entitytype_enum" NOT NULL,
        "key" character varying NOT NULL,
        "label" character varying NOT NULL,
        "type" "public"."custom_field_definitions_type_enum" NOT NULL,
        "required" boolean NOT NULL DEFAULT false,
        "options" jsonb,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_custom_field_entity_key" UNIQUE ("entityType", "key"),
        CONSTRAINT "PK_custom_field_definitions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "customFields" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN IF EXISTS "customFields"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_field_definitions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."custom_field_definitions_type_enum"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."custom_field_definitions_entitytype_enum"`,
    );
  }
}
