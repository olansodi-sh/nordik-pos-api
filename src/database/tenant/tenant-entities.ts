// Fase 1: todavía no se ha dividido qué entidades son centrales vs. por
// inquilino (eso ocurre en la Fase 2, cuando se quita businessId/
// TenantBaseEntity). Por ahora cada BD de inquilino se sincroniza con el
// mismo set de entidades/migraciones que la BD central, para probar el
// mecanismo de aprovisionamiento sin tocar el flujo de lectura actual.
export const TENANT_ENTITIES = [__dirname + '/../../**/*.entity{.ts,.js}'];
export const TENANT_MIGRATIONS_GLOB = __dirname + '/../migrations/*{.ts,.js}';
