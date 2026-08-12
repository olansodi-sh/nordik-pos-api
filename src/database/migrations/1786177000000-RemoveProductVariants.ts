import { MigrationInterface, QueryRunner } from 'typeorm';

// Elimina el concepto de ProductVariant: cada item vendible es ahora una fila
// de Product con su propio sku unico. Las relaciones entre productos
// emparentados se expresan con Custom Fields (ver modulo custom-fields), no
// con una tabla de agrupacion nueva.
export class RemoveProductVariants1786177000000 implements MigrationInterface {
  name = 'RemoveProductVariants1786177000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const backfillTargets: Array<{
      table: string;
      productCol: string;
      variantCol: string;
    }> = [
      { table: 'product_barcodes', productCol: 'productId', variantCol: 'variantId' },
      { table: 'stock', productCol: 'productId', variantCol: 'variantId' },
      { table: 'sale_lines', productCol: 'productId', variantCol: 'variantId' },
      { table: 'purchase_order_lines', productCol: 'productId', variantCol: 'variantId' },
      { table: 'purchase_invoice_lines', productCol: 'productId', variantCol: 'variantId' },
      { table: 'quote_lines', productCol: 'productId', variantCol: 'variantId' },
      { table: 'price_list_items', productCol: 'productId', variantCol: 'variantId' },
      { table: 'stock_movements', productCol: 'productId', variantCol: 'variantId' },
      { table: 'kit_components', productCol: 'componentProductId', variantCol: 'componentVariantId' },
    ];

    for (const t of backfillTargets) {
      await queryRunner.query(`
        UPDATE "${t.table}" AS target
        SET "${t.productCol}" = pv."productId"
        FROM "product_variants" pv
        WHERE target."${t.productCol}" IS NULL
          AND target."${t.variantCol}" IS NOT NULL
          AND pv.id = target."${t.variantCol}"
      `);
    }

    await queryRunner.query(`DELETE FROM "stock" WHERE "productId" IS NULL AND "variantId" IS NOT NULL`);
    await queryRunner.query(`DELETE FROM "product_barcodes" WHERE "productId" IS NULL AND "variantId" IS NOT NULL`);

    await queryRunner.query(`
      INSERT INTO "promotion_targets" ("promotionId", "targetType", "targetId")
      SELECT t."promotionId", 'product', pv."productId"
      FROM "promotion_targets" t
      JOIN "product_variants" pv ON pv.id = t."targetId"
      WHERE t."targetType" = 'variant'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`DELETE FROM "promotion_targets" WHERE "targetType" = 'variant'`);
    await queryRunner.query(`UPDATE "promotions" SET "scope" = 'product' WHERE "scope" = 'variant'`);

    await queryRunner.query(`ALTER TABLE "product_barcodes" DROP CONSTRAINT IF EXISTS "chk_barcode_owner"`);
    await queryRunner.query(`ALTER TABLE "sale_lines" DROP CONSTRAINT IF EXISTS "chk_sale_line_owner"`);
    await queryRunner.query(`ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "chk_stock_owner"`);
    await queryRunner.query(`ALTER TABLE "purchase_order_lines" DROP CONSTRAINT IF EXISTS "chk_po_line_owner"`);
    await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" DROP CONSTRAINT IF EXISTS "chk_pi_line_owner"`);
    await queryRunner.query(`ALTER TABLE "quote_lines" DROP CONSTRAINT IF EXISTS "chk_quote_line_owner"`);
    await queryRunner.query(`ALTER TABLE "price_list_items" DROP CONSTRAINT IF EXISTS "chk_price_item_owner"`);
    await queryRunner.query(`ALTER TABLE "kit_components" DROP CONSTRAINT IF EXISTS "chk_kit_component_owner"`);

    await queryRunner.query(`ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "FK_6d339d8c94554cdb8c4107218d9"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6d339d8c94554cdb8c4107218d"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."uq_stock_variant_warehouse"`);
    await queryRunner.query(`ALTER TABLE "stock" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "price_list_items" DROP CONSTRAINT IF EXISTS "FK_62e2bd922d11fc8204172d6789c"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."uq_price_list_variant"`);
    await queryRunner.query(`ALTER TABLE "price_list_items" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "product_barcodes" DROP CONSTRAINT IF EXISTS "FK_80bff17375afe2eedd36257c083"`);
    await queryRunner.query(`ALTER TABLE "product_barcodes" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "sale_lines" DROP CONSTRAINT IF EXISTS "FK_e66d6844db6460e1757430b5e18"`);
    await queryRunner.query(`ALTER TABLE "sale_lines" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "purchase_order_lines" DROP CONSTRAINT IF EXISTS "FK_0725cd52f439e7e6143b9ad3e89"`);
    await queryRunner.query(`ALTER TABLE "purchase_order_lines" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" DROP CONSTRAINT IF EXISTS "FK_afd882909d28dae4f05008fb048"`);
    await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "quote_lines" DROP CONSTRAINT IF EXISTS "FK_ae905d3a5c1c1ed25fcc860d09f"`);
    await queryRunner.query(`ALTER TABLE "quote_lines" DROP COLUMN IF EXISTS "variantId"`);

    await queryRunner.query(`ALTER TABLE "kit_components" DROP CONSTRAINT IF EXISTS "FK_c8d1db0e32552d6482de32d5a58"`);
    await queryRunner.query(`ALTER TABLE "kit_components" DROP COLUMN IF EXISTS "componentVariantId"`);

    await queryRunner.query(`ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "variantId"`);

    const notNullTargets = [
      { table: 'product_barcodes', col: 'productId' },
      { table: 'stock', col: 'productId' },
      { table: 'sale_lines', col: 'productId' },
      { table: 'purchase_order_lines', col: 'productId' },
      { table: 'purchase_invoice_lines', col: 'productId' },
      { table: 'quote_lines', col: 'productId' },
      { table: 'price_list_items', col: 'productId' },
      { table: 'stock_movements', col: 'productId' },
      { table: 'kit_components', col: 'componentProductId' },
    ];
    for (const t of notNullTargets) {
      await queryRunner.query(
        `ALTER TABLE "${t.table}" ALTER COLUMN "${t.col}" SET NOT NULL`,
      );
    }

    await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT IF EXISTS "FK_f515690c571a03400a9876600b5"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f515690c571a03400a9876600b"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants"`);

    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "hasVariants"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "hasVariants" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "productId" uuid NOT NULL, "cost" numeric(14,2) NOT NULL DEFAULT '0', "listPrice" numeric(14,2), "discountPercent" numeric(5,2) NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_product_variants" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_f515690c571a03400a9876600b" ON "product_variants" ("productId")`);
    await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    const variantColumnTargets = [
      { table: 'product_barcodes', productCol: 'productId', fk: 'FK_80bff17375afe2eedd36257c083' },
      { table: 'sale_lines', productCol: 'productId', fk: 'FK_e66d6844db6460e1757430b5e18' },
      { table: 'purchase_order_lines', productCol: 'productId', fk: 'FK_0725cd52f439e7e6143b9ad3e89' },
      { table: 'purchase_invoice_lines', productCol: 'productId', fk: 'FK_afd882909d28dae4f05008fb048' },
      { table: 'quote_lines', productCol: 'productId', fk: 'FK_ae905d3a5c1c1ed25fcc860d09f' },
      { table: 'price_list_items', productCol: 'productId', fk: 'FK_62e2bd922d11fc8204172d6789c' },
    ];
    for (const t of variantColumnTargets) {
      await queryRunner.query(`ALTER TABLE "${t.table}" ALTER COLUMN "${t.productCol}" DROP NOT NULL`);
      await queryRunner.query(`ALTER TABLE "${t.table}" ADD COLUMN "variantId" uuid`);
      await queryRunner.query(`ALTER TABLE "${t.table}" ADD CONSTRAINT "${t.fk}" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    await queryRunner.query(`ALTER TABLE "stock" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "stock" ADD COLUMN "variantId" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_6d339d8c94554cdb8c4107218d" ON "stock" ("variantId")`);
    await queryRunner.query(`ALTER TABLE "stock" ADD CONSTRAINT "FK_6d339d8c94554cdb8c4107218d9" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_stock_variant_warehouse" ON "stock" ("variantId", "warehouseId")`);

    await queryRunner.query(`CREATE UNIQUE INDEX "uq_price_list_variant" ON "price_list_items" ("priceListId", "variantId")`);

    await queryRunner.query(`ALTER TABLE "kit_components" ALTER COLUMN "componentProductId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "kit_components" ADD COLUMN "componentVariantId" uuid`);
    await queryRunner.query(`ALTER TABLE "kit_components" ADD CONSTRAINT "FK_c8d1db0e32552d6482de32d5a58" FOREIGN KEY ("componentVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "stock_movements" ALTER COLUMN "productId" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "stock_movements" ADD COLUMN "variantId" uuid`);

    await queryRunner.query(`ALTER TABLE "product_barcodes" ADD CONSTRAINT "chk_barcode_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "sale_lines" ADD CONSTRAINT "chk_sale_line_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "stock" ADD CONSTRAINT "chk_stock_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "chk_po_line_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "chk_pi_line_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "quote_lines" ADD CONSTRAINT "chk_quote_line_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "price_list_items" ADD CONSTRAINT "chk_price_item_owner" CHECK (("variantId" IS NOT NULL AND "productId" IS NULL) OR ("variantId" IS NULL AND "productId" IS NOT NULL))`);
    await queryRunner.query(`ALTER TABLE "kit_components" ADD CONSTRAINT "chk_kit_component_owner" CHECK (("componentVariantId" IS NOT NULL AND "componentProductId" IS NULL) OR ("componentVariantId" IS NULL AND "componentProductId" IS NOT NULL))`);
  }
}
