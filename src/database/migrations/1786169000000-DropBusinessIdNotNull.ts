import { MigrationInterface, QueryRunner } from 'typeorm';

// Corte de la Fase 2: las 24 entidades tenant-scoped ya no declaran
// businessId (el aislamiento es físico, una BD por inquilino). La columna
// física se conserva como dato histórico inerte (no se borra, por seguridad
// de rollback), pero debe dejar de ser NOT NULL — si no, cualquier INSERT
// nuevo (que ya no la puebla) rompe la restricción.
const TABLES = [
  'credit_notes',
  'customers',
  'expenses',
  'warehouses',
  'vouchers',
  'brands',
  'categories',
  'cash_sessions',
  'cash_registers',
  'recurring_invoices',
  'payments',
  'price_lists',
  'loyalty_point_transactions',
  'sales',
  'debit_notes',
  'purchase_invoices',
  'purchase_orders',
  'quotes',
  'promotions',
  'suppliers',
  'tasks',
  'task_columns',
  'products',
];

export class DropBusinessIdNotNull1786169000000 implements MigrationInterface {
  name = 'DropBusinessIdNotNull1786169000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = '${table}' AND column_name = 'businessId'
          ) THEN
            ALTER TABLE "${table}" ALTER COLUMN "businessId" DROP NOT NULL;
          END IF;
        END $$;
      `);
    }

    // La unicidad de sku pasa a ser por BD física (ya aislada por
    // inquilino), no por columna businessId.
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "uq_product_business_sku"`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT sku FROM "products" GROUP BY sku HAVING count(*) > 1)
        THEN
          ALTER TABLE "products" ADD CONSTRAINT "uq_product_sku" UNIQUE ("sku");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = '${table}' AND column_name = 'businessId'
          ) THEN
            ALTER TABLE "${table}" ALTER COLUMN "businessId" SET NOT NULL;
          END IF;
        END $$;
      `);
    }
  }
}
