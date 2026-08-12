import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantConnections1786163834818 implements MigrationInterface {
    name = 'AddTenantConnections1786163834818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenant_connections_status_enum" AS ENUM('provisioning', 'ready', 'failed')`);
        await queryRunner.query(`CREATE TABLE "tenant_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "businessId" uuid NOT NULL, "host" character varying NOT NULL, "port" integer NOT NULL, "databaseName" character varying NOT NULL, "username" character varying NOT NULL, "encryptedPassword" character varying NOT NULL, "status" "public"."tenant_connections_status_enum" NOT NULL DEFAULT 'provisioning', CONSTRAINT "PK_f966cc547b52de5d3df2025239f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ae433aed14fdff4271e949c11f" ON "tenant_connections"  ("businessId") `);
        await queryRunner.query(`ALTER TABLE "tenant_connections" ADD CONSTRAINT "FK_ae433aed14fdff4271e949c11fe" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_connections" DROP CONSTRAINT "FK_ae433aed14fdff4271e949c11fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae433aed14fdff4271e949c11f"`);
        await queryRunner.query(`DROP TABLE "tenant_connections"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_connections_status_enum"`);
    }

}
