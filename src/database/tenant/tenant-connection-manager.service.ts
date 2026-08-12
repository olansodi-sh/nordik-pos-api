import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { TenantConnection } from './entities/tenant-connection.entity';
import { decryptCredential } from './credential-crypto.util';
import { TENANT_ENTITIES, TENANT_MIGRATIONS_GLOB } from './tenant-entities';

interface CachedDataSource {
  dataSource: DataSource;
  lastUsedAt: number;
}

const IDLE_TTL_MS = Number(process.env.TENANT_DS_IDLE_TTL_MS ?? 10 * 60 * 1000);
const POOL_FLOOR = Number(process.env.TENANT_DS_POOL_FLOOR ?? 5);
const EVICTION_INTERVAL_MS = 60 * 1000;
const TENANT_POOL_SIZE = Number(process.env.TENANT_DS_POOL_SIZE ?? 5);
// Techo duro de inquilinos con DataSource simultáneamente abierto. Cada uno
// usa hasta TENANT_DS_POOL_SIZE conexiones reales a Postgres — el total de
// conexiones que este proceso puede llegar a abrir para inquilinos está
// acotado por TENANT_DS_MAX_CACHED * TENANT_DS_POOL_SIZE. Súbelo solo si
// max_connections de Postgres (y el resto de réplicas del API) lo soportan;
// nunca se probó bajo carga real, este es un valor conservador de partida.
const MAX_CACHED = Number(process.env.TENANT_DS_MAX_CACHED ?? 50);

// Estado a nivel de MÓDULO (no de instancia): Nest, al inyectar este
// servicio junto a una dependencia request-scoped en el mismo `inject` de
// un factory (ver TENANT_DATA_SOURCE en tenant-orm.module.ts), termina
// creando una instancia nueva de TenantConnectionManager por petición en
// vez de reutilizar el singleton — un gotcha conocido de Nest con
// providers mezclados en un mismo factory request-scoped. En vez de pelear
// con eso, el caché y el timer de limpieza viven aquí, a nivel de módulo
// (una sola vez por proceso, sin importar cuántas instancias de la clase
// termine creando Nest), así que el comportamiento es correcto de todos
// modos.
const sharedCache = new Map<string, CachedDataSource>();
const sharedInFlight = new Map<string, Promise<DataSource>>();
let evictionTimerStarted = false;

/**
 * Cache de DataSources por inquilino (una BD física por businessId, mismo
 * servidor Postgres). Abre la conexión perezosamente en el primer uso y la
 * cierra tras un período de inactividad para no agotar las conexiones del
 * servidor a medida que crecen los inquilinos. Un techo duro
 * (TENANT_DS_MAX_CACHED) evita que, si la limpieza por inactividad se queda
 * corta bajo carga, el número de inquilinos cacheados crezca sin límite.
 */
@Injectable()
export class TenantConnectionManager implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionManager.name);
  private readonly cache = sharedCache;
  // Deduplica conexiones concurrentes al mismo inquilino con caché fría: sin
  // esto, N peticiones simultáneas (ej. el dashboard pidiendo varios
  // reportes a la vez) ven todas cache.get()===undefined y cada una arranca
  // su propio DataSource en paralelo — desperdicia trabajo y, peor, dispara
  // el "camino async" del Proxy perezoso de TenantOrmModule para llamadas
  // que no lo soportan (ej. createQueryBuilder, que no es awaited). Con este
  // mapa, todas esas peticiones esperan la MISMA promesa, así que para
  // cuando cualquiera de ellas sigue, la caché ya quedó poblada.
  private readonly inFlight = sharedInFlight;

  constructor(
    @InjectRepository(TenantConnection)
    private readonly connectionsRepository: Repository<TenantConnection>,
  ) {
    if (!evictionTimerStarted) {
      evictionTimerStarted = true;
      setInterval(() => {
        void this.evictIdle();
      }, EVICTION_INTERVAL_MS).unref();
    }
  }

  /** Lookup síncrono, sin I/O — solo devuelve algo si ya se resolvió antes. */
  peekCachedDataSource(businessId: string): DataSource | undefined {
    const hit = this.cache.get(businessId);
    if (hit) hit.lastUsedAt = Date.now();
    return hit?.dataSource;
  }

  async getDataSourceForTenant(businessId: string): Promise<DataSource> {
    const hit = this.cache.get(businessId);
    if (hit) {
      hit.lastUsedAt = Date.now();
      return hit.dataSource;
    }

    const pending = this.inFlight.get(businessId);
    if (pending) return pending;

    const promise = this.connectTenant(businessId).finally(() => {
      this.inFlight.delete(businessId);
    });
    this.inFlight.set(businessId, promise);
    return promise;
  }

  private async connectTenant(businessId: string): Promise<DataSource> {
    const conn = await this.connectionsRepository.findOne({ where: { businessId } });
    if (!conn) {
      throw new NotFoundException(
        `No hay una base de datos aprovisionada para el negocio ${businessId}`,
      );
    }

    if (this.cache.size >= MAX_CACHED) {
      await this.evictLeastRecentlyUsed();
    }

    const dataSource = await this.buildDataSource(conn);
    await dataSource.initialize();
    // Aplica cualquier migración pendiente al conectar (no solo al
    // aprovisionar) — así una BD de inquilino ya existente recibe cambios de
    // esquema posteriores sin necesitar un paso de aprovisionamiento aparte.
    await dataSource.runMigrations();
    this.cache.set(businessId, { dataSource, lastUsedAt: Date.now() });
    return dataSource;
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    let oldestId: string | undefined;
    let oldestAt = Infinity;
    for (const [id, entry] of this.cache) {
      if (entry.lastUsedAt < oldestAt) {
        oldestAt = entry.lastUsedAt;
        oldestId = id;
      }
    }
    if (oldestId) {
      this.logger.warn(
        `Techo de ${MAX_CACHED} inquilinos cacheados alcanzado — cerrando el menos usado (${oldestId}).`,
      );
      await this.evictTenant(oldestId);
    }
  }

  private async buildDataSource(conn: TenantConnection): Promise<DataSource> {
    return new DataSource({
      type: 'postgres',
      host: conn.host,
      port: conn.port,
      username: conn.username,
      password: decryptCredential(conn.encryptedPassword),
      database: conn.databaseName,
      entities: TENANT_ENTITIES,
      migrations: [TENANT_MIGRATIONS_GLOB],
      synchronize: false,
      poolSize: TENANT_POOL_SIZE,
    });
  }

  /** Cierra y descarta la conexión cacheada de un inquilino, si existe. Usado antes de desaprovisionar (borrar) su BD. */
  async evictTenant(businessId: string): Promise<void> {
    const hit = this.cache.get(businessId);
    if (!hit) return;
    this.cache.delete(businessId);
    await hit.dataSource.destroy().catch((err: Error) => {
      this.logger.warn(`Error cerrando DataSource de ${businessId}: ${err.message}`);
    });
  }

  private async evictIdle(): Promise<void> {
    const cutoff = Date.now() - IDLE_TTL_MS;
    for (const [businessId, entry] of this.cache) {
      if (entry.lastUsedAt < cutoff && this.cache.size > POOL_FLOOR) {
        this.cache.delete(businessId);
        await entry.dataSource.destroy().catch((err: Error) => {
          this.logger.warn(`Error cerrando DataSource de ${businessId}: ${err.message}`);
        });
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const [, entry] of this.cache) {
      await entry.dataSource.destroy().catch(() => undefined);
    }
    this.cache.clear();
  }
}
