import { Client } from 'pg';

/**
 * Runbook de la Fase 2: copia las filas de cada tabla tenant-scoped desde la
 * BD central hacia la BD física de cada inquilino, y verifica que los
 * conteos coincidan. NO borra ni modifica la BD de origen.
 *
 * Dos modos de tabla:
 *  - DIRECT_TABLES: tienen su propia columna "businessId" — se filtran/
 *    copian directamente. Seguro de re-correr (borra por businessId antes
 *    de insertar).
 *  - JOIN_TABLES: tablas hijas/de unión sin columna "businessId" propia
 *    (líneas de venta, adjuntos de producto, etc.) — se resuelven subiendo
 *    a su tabla padre (ver joinClause/businessIdExpr de cada una). Se
 *    insertan con ON CONFLICT DO NOTHING (todas tienen PK propia o
 *    compuesta), así que también es seguro re-correr. IMPORTANTE: deben
 *    procesarse DESPUÉS de que su(s) tabla(s) padre ya estén copiadas (los
 *    padres directos ya lo están por ir primero; dentro de JOIN_TABLES,
 *    product_variants va antes que product_barcodes, que depende de ella).
 *
 * No excluye la columna "businessId" al copiar (se incluye tal cual en las
 * tablas DIRECT — queda como dato histórico inerte en el destino, igual que
 * en el resto de la migración de la Fase 2).
 *
 * Uso:
 *   CENTRAL_URL=... TENANT_MAP='{"<businessId>":"<url-tenant>"}' \
 *   npx ts-node -r tsconfig-paths/register src/database/scripts/split-tenant-data.ts
 */

const DIRECT_TABLES = [
  'brands',
  'business_invoicing_settings',
  'cash_registers',
  'cash_sessions',
  'categories',
  'credit_notes',
  'customers',
  'debit_notes',
  'expenses',
  'loyalty_point_transactions',
  'loyalty_settings',
  'payments',
  'price_lists',
  'products',
  'promotions',
  'purchase_invoices',
  'purchase_orders',
  'quotes',
  'recurring_invoices',
  'roles',
  'sales',
  'stock_movements',
  'suppliers',
  'task_columns',
  'tasks',
  'users',
  'vouchers',
  'warehouses',
];

interface JoinTableSpec {
  table: string;
  joinClause: string;
  businessIdExpr: string;
}

// Orden importa: una tabla debe listarse después de aquellas de las que
// depende su joinClause (ver comentario arriba sobre product_variants).
const JOIN_TABLES: JoinTableSpec[] = [
  { table: 'kit_components', joinClause: 'JOIN products p ON p.id = t."kitProductId"', businessIdExpr: 'p."businessId"' },
  { table: 'payment_allocations', joinClause: 'JOIN payments p ON p.id = t."paymentId"', businessIdExpr: 'p."businessId"' },
  { table: 'price_list_items', joinClause: 'JOIN price_lists p ON p.id = t."priceListId"', businessIdExpr: 'p."businessId"' },
  { table: 'product_images', joinClause: 'JOIN products p ON p.id = t."productId"', businessIdExpr: 'p."businessId"' },
  { table: 'product_variants', joinClause: 'JOIN products p ON p.id = t."productId"', businessIdExpr: 'p."businessId"' },
  {
    table: 'product_barcodes',
    // El código de barras cuelga de un producto O de una variante (nunca ambos).
    joinClause: `
      LEFT JOIN products p1 ON p1.id = t."productId"
      LEFT JOIN product_variants pv ON pv.id = t."variantId"
      LEFT JOIN products p2 ON p2.id = pv."productId"
    `,
    businessIdExpr: 'COALESCE(p1."businessId", p2."businessId")',
  },
  { table: 'promotion_targets', joinClause: 'JOIN promotions p ON p.id = t."promotionId"', businessIdExpr: 'p."businessId"' },
  { table: 'purchase_invoice_lines', joinClause: 'JOIN purchase_invoices p ON p.id = t."invoiceId"', businessIdExpr: 'p."businessId"' },
  { table: 'purchase_order_lines', joinClause: 'JOIN purchase_orders p ON p.id = t."orderId"', businessIdExpr: 'p."businessId"' },
  { table: 'quote_lines', joinClause: 'JOIN quotes p ON p.id = t."quoteId"', businessIdExpr: 'p."businessId"' },
  // Obsoleta desde que Role.permissionCodes reemplazó este join (ver
  // migración RolePermissionCodes) — se incluye solo por completitud
  // histórica; roles ya trae los permisos correctos por su cuenta.
  { table: 'role_permissions', joinClause: 'JOIN roles p ON p.id = t."rolesId"', businessIdExpr: 'p."businessId"' },
  { table: 'sale_lines', joinClause: 'JOIN sales p ON p.id = t."saleId"', businessIdExpr: 'p."businessId"' },
  { table: 'sale_electronic_invoices', joinClause: 'JOIN sales p ON p.id = t."saleId"', businessIdExpr: 'p."businessId"' },
  { table: 'stock', joinClause: 'JOIN warehouses p ON p.id = t."warehouseId"', businessIdExpr: 'p."businessId"' },
  { table: 'cash_movements', joinClause: 'JOIN cash_sessions p ON p.id = t."sessionId"', businessIdExpr: 'p."businessId"' },
];

interface TenantMapEntry {
  businessId: string;
  name: string;
  targetUrl: string;
}

interface CopyResult {
  table: string;
  sourceCount: number;
  targetCount: number;
  ok: boolean;
}

async function copyDirectTable(
  source: Client,
  target: Client,
  table: string,
  businessId: string,
): Promise<CopyResult> {
  const { rows } = await source.query(`SELECT * FROM "${table}" WHERE "businessId" = $1`, [businessId]);

  await target.query(`DELETE FROM "${table}" WHERE "businessId" = $1`, [businessId]);

  if (rows.length > 0) {
    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(', ');
    for (const row of rows) {
      const values = columns.map((c) => row[c]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      await target.query(`INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`, values);
    }
  }

  const targetCountRes = await target.query(
    `SELECT count(*)::int AS c FROM "${table}" WHERE "businessId" = $1`,
    [businessId],
  );

  return {
    table,
    sourceCount: rows.length,
    targetCount: targetCountRes.rows[0].c,
    ok: rows.length === targetCountRes.rows[0].c,
  };
}

async function copyJoinTable(
  source: Client,
  target: Client,
  spec: JoinTableSpec,
  businessId: string,
): Promise<CopyResult> {
  const selectSql = `SELECT t.* FROM "${spec.table}" t ${spec.joinClause} WHERE ${spec.businessIdExpr} = $1`;
  const { rows } = await source.query(selectSql, [businessId]);

  if (rows.length > 0) {
    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `"${c}"`).join(', ');
    for (const row of rows) {
      const values = columns.map((c) => row[c]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      await target.query(
        `INSERT INTO "${spec.table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values,
      );
    }
  }

  const targetCountRes = await target.query(
    `SELECT count(*)::int AS c FROM "${spec.table}" t ${spec.joinClause} WHERE ${spec.businessIdExpr} = $1`,
    [businessId],
  );

  return {
    table: spec.table,
    sourceCount: rows.length,
    targetCount: targetCountRes.rows[0].c,
    ok: rows.length === targetCountRes.rows[0].c,
  };
}

async function migrateBusiness(centralUrl: string, entry: TenantMapEntry): Promise<CopyResult[]> {
  const source = new Client({ connectionString: centralUrl });
  const target = new Client({ connectionString: entry.targetUrl });
  await source.connect();
  await target.connect();

  // Desactiva la validación de FKs/triggers durante la copia: las filas ya
  // son consistentes en el origen, no hace falta reproducir el orden de
  // inserción entre tablas dependientes (aunque JOIN_TABLES igual respeta un
  // orden razonable, por si esto se corre alguna vez con FKs activas).
  await target.query(`SET session_replication_role = 'replica';`);

  const results: CopyResult[] = [];
  try {
    for (const table of DIRECT_TABLES) {
      results.push(await copyDirectTable(source, target, table, entry.businessId));
    }
    for (const spec of JOIN_TABLES) {
      results.push(await copyJoinTable(source, target, spec, entry.businessId));
    }
  } finally {
    await target.query(`SET session_replication_role = 'origin';`);
    await source.end();
    await target.end();
  }

  return results;
}

async function main() {
  const centralUrl = process.env.CENTRAL_URL;
  const tenantMapRaw = process.env.TENANT_MAP;
  if (!centralUrl || !tenantMapRaw) {
    console.error('Faltan CENTRAL_URL y/o TENANT_MAP en el entorno.');
    process.exit(1);
  }
  const tenantMap: Record<string, { name: string; targetUrl: string }> = JSON.parse(tenantMapRaw);

  let allOk = true;
  for (const [businessId, info] of Object.entries(tenantMap)) {
    console.log(`\n=== ${info.name} (${businessId}) ===`);
    const results = await migrateBusiness(centralUrl, { businessId, name: info.name, targetUrl: info.targetUrl });
    for (const r of results) {
      const marker = r.ok ? 'OK ' : 'MISMATCH';
      console.log(`  [${marker}] ${r.table}: origen=${r.sourceCount} destino=${r.targetCount}`);
      if (!r.ok) allOk = false;
    }
  }

  console.log(allOk ? '\nTodos los conteos coinciden.' : '\nHay tablas con conteos distintos — revisar antes de continuar.');
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
