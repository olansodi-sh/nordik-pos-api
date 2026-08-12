# Runbook — arquitectura multi-tenant (BD por inquilino)

Este documento explica cómo opera la arquitectura de base de datos física por
inquilino, cómo ejecutar las operaciones que no pasan por la UI, y qué
revisar cuando algo falla. Está pensado para alguien que no participó en la
migración original.

## 1. Arquitectura en una página

- **BD central** (`DATABASE_URL`, la de siempre): `businesses`, `users`,
  `user_tenant_memberships`, `permissions` (catálogo global), `menu_items`,
  `menu_access_rules`, `tenant_connections`. Un usuario vive **una sola vez**
  aquí, sin importar a cuántas empresas pertenezca.
- **BD por inquilino** (`tenant_<businessId sin guiones>`, mismo servidor
  Postgres): todo lo transaccional — `roles`, `products`, `sales`, `stock`,
  `customers`, etc. Cada negocio tiene la suya, físicamente separada.
- **`TenantConnection`** (tabla central): mapea `businessId` → host/puerto/
  nombre de BD/credenciales (cifradas) de su base física.
- **`TenantConnectionManager`** (`pos-api/src/database/tenant/tenant-connection-manager.service.ts`):
  cachea un `DataSource` de TypeORM por inquilino, abierto perezosamente en
  el primer uso y cerrado tras inactividad (o al tocar el techo duro de
  inquilinos cacheados). Es el único lugar del código que sabe abrir una
  conexión a la BD de un inquilino.
- **`TenantOrmModule.forFeature(...)`** — reemplazo de
  `TypeOrmModule.forFeature(...)` para cualquier entidad que viva en la BD
  del inquilino. Usa el mismo token que `@InjectRepository`, así que un
  servicio de negocio no nota la diferencia.
- **Rol vs. Permiso vs. Menú** — tres sistemas independientes que a veces se
  confunden:
  - `Permission`/`Role.permissionCodes` (BD del inquilino): qué **acciones**
    puede hacer un usuario (ver/crear/editar/borrar) en una pantalla a la
    que ya tiene acceso.
  - `MenuItem`/`MenuAccessRule` (BD central, por membresía): qué
    **pantallas** ve un usuario, independiente de su rol.
  - `CustomFieldDefinition` (BD del inquilino): campos propios que un
    negocio agrega a una entidad (hoy solo `Sale`).

## 2. Operaciones comunes

### Crear una empresa nueva
Se hace desde la UI (`Empresas`, solo superadmin) o `POST /businesses`.
Dispara automáticamente, en este orden y de forma **síncrona** (si algo
falla a mitad de camino, la empresa completa no queda creada a medias):
1. `CREATE DATABASE` física (`TenantProvisioningService.createDatabase`).
2. Se corren todas las migraciones contra esa BD vacía
   (`ds.runMigrations()`).
3. Se siembran los roles por defecto (Admin/Vendedor/Cajero) y la lista de
   precios "Consumidor Final" directamente en esa BD.
4. Se crean los usuarios administradores + su membresía (con `isDefault:
   true` si es su primera empresa).

### Eliminar una empresa
`DELETE /businesses/:id` (solo superadmin) ahora **sí** limpia todo:
cierra la conexión cacheada, hace `DROP DATABASE ... WITH (FORCE)` de su
base física, borra el `TenantConnection`, y por último la fila de
`businesses`. Antes de un ajuste reciente esto dejaba la base física
huérfana — si ves bases `tenant_*` en el servidor sin fila correspondiente
en `tenant_connections`, son residuo de negocios borrados **antes** de ese
ajuste; se pueden borrar a mano tras confirmar que no hay nada de valor:
```sql
DROP DATABASE "tenant_<id_sin_guiones>";
```

### Agregar un usuario existente a otra empresa
`POST /users` (con el negocio destino ya seleccionado, o `businessId`
explícito si quien crea es superadmin) — si el email ya existe, **no
duplica la cuenta**: le agrega una membresía nueva a esa empresa con el rol
indicado. La cuenta (contraseña, nombre) sigue siendo una sola.

### Migrar los datos de una BD compartida vieja a bases por inquilino
Ver `pos-api/src/database/scripts/split-tenant-data.ts`. Cubre tanto tablas
con columna `businessId` propia como tablas hijas/de unión que la resuelven
por join hacia su tabla padre (líneas de venta, variantes de producto,
`stock`, etc.). Es seguro re-correrlo (usa `DELETE` + reinsert en las
tablas con `businessId`, y `ON CONFLICT DO NOTHING` en las que van por
join).

**Antes de correrlo contra datos reales**, hazlo primero contra un clon:
```bash
# 1. Clonar la BD central y la(s) BD(s) de inquilino a probar
pg_dump -U postgres -Fc nordikhat_pos > /tmp/central.dump
createdb nordikhat_pos_dryrun && pg_restore -U postgres -d nordikhat_pos_dryrun /tmp/central.dump

# 2. Correr el script contra los clones
cd pos-api
CENTRAL_URL="postgres://postgres:postgres@localhost:5442/nordikhat_pos_dryrun" \
TENANT_MAP='{"<businessId>":{"name":"<nombre>","targetUrl":"postgres://.../tenant_dryrun"}}' \
npx ts-node -r tsconfig-paths/register src/database/scripts/split-tenant-data.ts

# 3. Revisar la salida — debe decir "Todos los conteos coinciden." al final.
#    Si hay [MISMATCH], NO seguir sin entender por qué.

# 4. Recién ahí, correrlo contra las BDs reales (con las URLs reales).
```
Si en el futuro aparecen tablas hijas nuevas sin `businessId` propio,
agrégalas a `JOIN_TABLES` en el script (documentado ahí mismo cómo).

## 3. Migraciones de esquema

- `synchronize` está apagado en todo entorno. Los cambios de esquema van
  por migraciones normales de TypeORM en `pos-api/src/database/migrations/`.
- **Las mismas migraciones corren contra la BD central Y contra cada BD de
  inquilino** (comparten la carpeta). Si una migración solo debe aplicar a
  un lado, hazla defensiva (`IF EXISTS`, `DO $$ ... EXCEPTION ...`) — varias
  migraciones de esta fase tuvieron que corregirse así porque tocaban una
  columna/tabla que no existía igual en ambos lados.
- Al conectar, `TenantConnectionManager` corre `runMigrations()` automático
  — una BD de inquilino ya existente recibe cambios de esquema nuevos sin
  pasos manuales. Para aplicar una migración nueva a mano contra un
  inquilino puntual (ej. para no esperar a que alguien inicie sesión):
  ```bash
  DATABASE_URL="postgres://.../tenant_<id>" npm run migration:run
  ```
- Generar una migración nueva: `npm run migration:generate -- src/database/migrations/NombreDescriptivo`.
  **Cuidado**: como hay columnas `businessId` legacy que se dejaron a
  propósito (ver sección 4), el diff automático va a proponer borrarlas —
  revisa el archivo generado a mano antes de aplicarlo, no lo corras a
  ciegas.

## 4. Decisiones de diseño que vale la pena recordar

- **Las columnas `businessId` viejas no se borraron físicamente** de las
  ~24 tablas que las tenían (solo se quitaron de las entidades TypeScript y
  se les quitó el `NOT NULL`). Quedan como dato histórico inerte, tanto en
  la BD central (legacy) como en cada BD de inquilino (llegaron ahí vía el
  script de la sección 2). No se usan para nada — el aislamiento es
  físico — pero no se eliminaron para no arriesgar una migración
  irreversible sin necesidad real.
- **`role_permissions` (la tabla de unión vieja) es obsoleta**: reemplazada
  por `Role.permissionCodes` (un array de texto). Se conserva por
  completitud histórica en el script de copia, pero nada la lee.
- **Un `DataSource` de inquilino solo se resuelve dentro de un método de
  servicio/controlador, nunca en un constructor.** Nest arma el árbol de
  dependencias de una petición antes de correr los guards de autenticación
  — leer `businessId` en ese momento temprano falla porque `request.user`
  todavía no existe. Por eso `TenantOrmModule.forFeature(...)` devuelve
  repositorios envueltos en un Proxy perezoso (`createLazyDataSource` /
  `lazyProxy` en `tenant-orm.module.ts`) que no toca nada hasta el primer
  uso real. Si en el futuro se agrega otro punto de entrada que necesite la
  conexión del inquilino, **no** se puede leer `ctx.businessId` de forma
  eager en un factory de DI — hay que replicar este patrón perezoso.

## 5. Pool de conexiones — qué configurar y por qué

Variables de entorno de `TenantConnectionManager`:

| Variable | Default | Qué hace |
|---|---|---|
| `TENANT_DS_POOL_SIZE` | 5 | Conexiones Postgres reales por inquilino cacheado |
| `TENANT_DS_IDLE_TTL_MS` | 10 min | Tiempo de inactividad antes de cerrar la conexión de un inquilino |
| `TENANT_DS_POOL_FLOOR` | 5 | No evictar por inactividad si ya hay menos de este número cacheados |
| `TENANT_DS_MAX_CACHED` | 50 | Techo duro — si se alcanza, cierra el inquilino menos usado antes de abrir uno nuevo |

El total de conexiones que este proceso puede llegar a abrir hacia
Postgres para inquilinos está acotado por
`TENANT_DS_MAX_CACHED × TENANT_DS_POOL_SIZE` (+ el pool de la conexión
central). **Esto nunca se probó bajo carga real** — los valores por defecto
son conservadores, pensados para no agotar `max_connections` de Postgres en
un servidor pequeño. Antes de tener más de unas pocas decenas de negocios
activos simultáneamente, hay que hacer una prueba de carga real y ajustar
estos números (y probablemente subir `max_connections` en Postgres).

## 6. Cosas que siguen pendientes (no resueltas en este runbook)

- Sin pruebas de carga reales sobre el pool de conexiones (sección 5).
- El script de la sección 2 asume que las tablas hijas conocidas hoy son
  las únicas — si se agrega una entidad nueva con FK a otra tenant-scoped,
  hay que sumarla ahí a mano.
- No hay rotación automática de `TENANT_DB_ENCRYPTION_KEY` (la clave que
  cifra las credenciales de conexión en `tenant_connections`). Cambiarla
  invalida el descifrado de las credenciales ya guardadas.
