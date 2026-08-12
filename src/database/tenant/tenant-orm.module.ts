import { DynamicModule, Global, Module, Provider, Scope } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { TenantConnection } from './entities/tenant-connection.entity';
import { TenantConnectionManager } from './tenant-connection-manager.service';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantContext } from '../../common/tenant/tenant-context';

export const TENANT_DATA_SOURCE = Symbol('TENANT_DATA_SOURCE');

/**
 * Envuelve un objeto (DataSource o Repository real del inquilino) en un
 * Proxy perezoso: nada se resuelve (ni siquiera ctx.businessId) hasta que
 * alguien accede a una propiedad de verdad. Esto es necesario porque Nest
 * arma el árbol de dependencias request-scoped de un controlador ANTES de
 * correr los guards que autentican la petición — leer ctx.businessId en ese
 * momento fallaría (todavía no hay request.user). Diferir la lectura hasta
 * el primer uso real (siempre dentro del cuerpo de un método de
 * servicio/controlador, nunca en un constructor) la hace segura, porque
 * para entonces los guards ya corrieron.
 *
 * `resolveReal` debe devolver, a partir del DataSource ya resuelto, el
 * objeto real cuyos miembros se están exponiendo (el propio DataSource, o
 * `dataSource.getRepository(entity)`).
 */
function lazyProxy<T extends object>(
  manager: TenantConnectionManager,
  ctx: TenantContext,
  resolveReal: (dataSource: DataSource) => T,
): T {
  return new Proxy(
    {},
    {
      get(_target, prop, receiver) {
        // Nest (y Node en general) hace duck-typing de "es esto una Promise"
        // consultando `.then` en cualquier valor resuelto de un provider —
        // sin este guard, esa sola lectura dispara ctx.businessId antes de
        // tiempo (durante el armado del árbol de dependencias, no dentro del
        // handler). Debe comportarse como un objeto NO thenable.
        if (prop === 'then' || typeof prop === 'symbol') {
          return undefined;
        }
        const cached = manager.peekCachedDataSource(ctx.businessId);
        if (cached) {
          const real = resolveReal(cached);
          const value = Reflect.get(real, prop, receiver);
          return typeof value === 'function' ? value.bind(real) : value;
        }
        // Sin conexión cacheada todavía (caso raro — JwtStrategy la
        // precalienta en cada petición autenticada): solo sirve para
        // miembros que ya son async (find/save/transaction/...).
        return (...args: unknown[]) =>
          manager.getDataSourceForTenant(ctx.businessId).then((ds) => {
            const real = resolveReal(ds) as Record<string | symbol, (...a: unknown[]) => unknown>;
            return real[prop](...args);
          });
      },
    },
  ) as T;
}

function createLazyDataSource(manager: TenantConnectionManager, ctx: TenantContext): DataSource {
  const dataSource = lazyProxy(manager, ctx, (ds) => ds);
  return new Proxy(dataSource, {
    get(target, prop, receiver) {
      if (prop === 'getRepository') {
        return (entity: EntityTarget<ObjectLiteral>) =>
          lazyProxy(manager, ctx, (ds) => ds.getRepository(entity)) as Repository<ObjectLiteral>;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * Infraestructura multi-DataSource (Fase 2 - corte): registra TenantConnection
 * en la BD central, expone TenantConnectionManager/TenantProvisioningService,
 * y TenantOrmModule.forFeature(entities) — el reemplazo de
 * TypeOrmModule.forFeature(entities) para entidades que viven en la BD del
 * inquilino. Usa el mismo token que @InjectRepository espera, así que los
 * servicios existentes (TenantScopedService, @InjectRepository(Entity)) no
 * cambian: solo cambia de dónde viene la conexión.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TenantConnection])],
  providers: [
    TenantConnectionManager,
    TenantProvisioningService,
    {
      provide: TENANT_DATA_SOURCE,
      scope: Scope.REQUEST,
      useFactory: (manager: TenantConnectionManager, ctx: TenantContext) =>
        createLazyDataSource(manager, ctx),
      inject: [TenantConnectionManager, TenantContext],
    },
  ],
  exports: [TenantConnectionManager, TenantProvisioningService, TENANT_DATA_SOURCE],
})
export class TenantOrmModule {
  static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
    const providers: Provider[] = entities.map((entity) => ({
      provide: getRepositoryToken(entity),
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => dataSource.getRepository(entity as never),
      inject: [TENANT_DATA_SOURCE],
    }));
    return { module: TenantOrmModule, providers, exports: providers };
  }
}
