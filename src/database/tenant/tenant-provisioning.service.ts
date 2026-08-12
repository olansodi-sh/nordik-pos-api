import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'pg';
import { DataSource, Repository } from 'typeorm';
import {
  TenantConnection,
  TenantConnectionStatus,
} from './entities/tenant-connection.entity';
import { encryptCredential } from './credential-crypto.util';
import { TENANT_ENTITIES, TENANT_MIGRATIONS_GLOB } from './tenant-entities';
import { Role } from '../../modules/rbac/entities/role.entity';
import { PriceList } from '../../modules/pricing/entities/price-list.entity';
import { BASE_PERMISSIONS } from '../../modules/rbac/permissions.constants';
import { TenantConnectionManager } from './tenant-connection-manager.service';

interface ServerCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface ProvisioningResult {
  connection: TenantConnection;
  adminRoleId: string;
}

function parseServerCredentials(databaseUrl: string): ServerCredentials {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

function tenantDatabaseName(businessId: string): string {
  return `tenant_${businessId.replace(/-/g, '')}`;
}

const DEFAULT_ROLE_NAMES = {
  admin: 'Admin',
  seller: 'Vendedor',
  cashier: 'Cajero',
} as const;

/**
 * Aprovisiona una base de datos física nueva para un negocio: crea la BD en
 * el mismo servidor Postgres, sincroniza su esquema reutilizando las
 * migraciones existentes, siembra los roles y la lista de precios por
 * defecto directamente ahí (Role/PriceList ya no viven en la BD central, así
 * que este es el único punto con una conexión "cruda" al inquilino nuevo
 * antes de que exista ninguna sesión de usuario para ese negocio), y
 * registra la conexión en TenantConnection. No se ejecuta dentro de ninguna
 * transacción (CREATE DATABASE de Postgres lo prohíbe).
 */
@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);
  private readonly server: ServerCredentials;

  constructor(
    @InjectRepository(TenantConnection)
    private readonly connectionsRepository: Repository<TenantConnection>,
    private readonly connectionManager: TenantConnectionManager,
  ) {
    this.server = parseServerCredentials(
      process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
    );
  }

  async provisionForBusiness(businessId: string): Promise<ProvisioningResult> {
    const databaseName = tenantDatabaseName(businessId);

    let conn = this.connectionsRepository.create({
      businessId,
      host: this.server.host,
      port: this.server.port,
      databaseName,
      username: this.server.username,
      encryptedPassword: encryptCredential(this.server.password),
      status: TenantConnectionStatus.PROVISIONING,
    });
    conn = await this.connectionsRepository.save(conn);

    let adminRoleId: string;
    try {
      await this.createDatabase(databaseName);
      adminRoleId = await this.syncSchemaAndSeed(databaseName);
      conn.status = TenantConnectionStatus.READY;
      await this.connectionsRepository.save(conn);
      this.logger.log(`BD de inquilino "${databaseName}" lista para el negocio ${businessId}`);
    } catch (err) {
      conn.status = TenantConnectionStatus.FAILED;
      await this.connectionsRepository.save(conn);
      this.logger.error(
        `Fallo aprovisionando BD de inquilino "${databaseName}": ${(err as Error).message}`,
      );
      throw err;
    }

    return { connection: conn, adminRoleId };
  }

  /**
   * Elimina por completo la base de datos física de un negocio y su registro
   * de conexión — se llama al borrar un negocio, para no dejar bases
   * huérfanas en el servidor. No falla si el negocio nunca llegó a
   * aprovisionarse (no hay TenantConnection para él).
   */
  async deprovisionForBusiness(businessId: string): Promise<void> {
    const conn = await this.connectionsRepository.findOne({ where: { businessId } });
    if (!conn) return;

    await this.connectionManager.evictTenant(businessId);

    const client = new Client({
      host: this.server.host,
      port: this.server.port,
      user: this.server.username,
      password: this.server.password,
      database: 'postgres',
    });
    await client.connect();
    try {
      // WITH (FORCE) corta cualquier conexión residual a la BD (Postgres 13+)
      // — sin esto, DROP DATABASE falla si queda algo conectado.
      await client.query(`DROP DATABASE IF EXISTS "${conn.databaseName}" WITH (FORCE)`);
    } finally {
      await client.end();
    }

    await this.connectionsRepository.remove(conn);
    this.logger.log(`BD de inquilino "${conn.databaseName}" eliminada para el negocio ${businessId}`);
  }

  private async createDatabase(databaseName: string): Promise<void> {
    const client = new Client({
      host: this.server.host,
      port: this.server.port,
      user: this.server.username,
      password: this.server.password,
      database: 'postgres',
    });
    await client.connect();
    try {
      // CREATE DATABASE no puede ejecutarse dentro de una transacción.
      await client.query(`CREATE DATABASE "${databaseName}"`);
    } finally {
      await client.end();
    }
  }

  private async syncSchemaAndSeed(databaseName: string): Promise<string> {
    const ds = new DataSource({
      type: 'postgres',
      host: this.server.host,
      port: this.server.port,
      username: this.server.username,
      password: this.server.password,
      database: databaseName,
      entities: TENANT_ENTITIES,
      migrations: [TENANT_MIGRATIONS_GLOB],
      synchronize: false,
    });
    await ds.initialize();
    try {
      await ds.runMigrations();

      const roleRepo = ds.getRepository(Role);
      const admin = await roleRepo.save(
        roleRepo.create({ name: DEFAULT_ROLE_NAMES.admin, permissionCodes: [...BASE_PERMISSIONS] }),
      );
      await roleRepo.save([
        roleRepo.create({ name: DEFAULT_ROLE_NAMES.seller, permissionCodes: [] }),
        roleRepo.create({ name: DEFAULT_ROLE_NAMES.cashier, permissionCodes: [] }),
      ]);

      const priceListRepo = ds.getRepository(PriceList);
      await priceListRepo.save(
        priceListRepo.create({ name: 'Consumidor Final', isDefault: true }),
      );

      return admin.id;
    } finally {
      await ds.destroy();
    }
  }
}
