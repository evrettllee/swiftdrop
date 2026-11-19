import { and, asc, desc, eq, inArray, isNotNull, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import { adminActions, serviceZones, tariffs, users } from '@/database/schema';

const actors = alias(users, 'actors');

export const TARIFF_ROW_COLUMNS = {
  tariffId: tariffs.tariffId,
  name: tariffs.name,
  pricePerKm: tariffs.pricePerKm,
  pricePerKg: tariffs.pricePerKg,
  minPrice: tariffs.minPrice,
  fragileFee: tariffs.fragileFee,
  isActive: tariffs.isActive,
  updatedAt: tariffs.updatedAt,
};

function ofTariffs(column: typeof tariffs.tariffId | typeof serviceZones.tariffId, ids?: number[]) {
  return ids === undefined ? undefined : inArray(column, ids);
}

export function findTariffRows(db: Database, ids?: number[]) {
  return db
    .select(TARIFF_ROW_COLUMNS)
    .from(tariffs)
    .where(ofTariffs(tariffs.tariffId, ids))
    .orderBy(desc(tariffs.isActive), asc(tariffs.name), asc(tariffs.tariffId));
}

export function findTariffZones(db: Database, ids?: number[]) {
  return db
    .select({
      tariffId: serviceZones.tariffId,
      zoneId: serviceZones.zoneId,
      name: serviceZones.name,
      isActive: serviceZones.isActive,
    })
    .from(serviceZones)
    .where(ofTariffs(serviceZones.tariffId, ids))
    .orderBy(asc(serviceZones.name), asc(serviceZones.zoneId));
}

export function findLastTariffActors(db: Database, ids?: number[]) {
  const scope: SQL | undefined =
    ids === undefined ? isNotNull(adminActions.tariffId) : inArray(adminActions.tariffId, ids);

  return db
    .selectDistinctOn([adminActions.tariffId], {
      tariffId: adminActions.tariffId,
      firstName: actors.firstName,
      lastName: actors.lastName,
    })
    .from(adminActions)
    .innerJoin(actors, eq(actors.userId, adminActions.actorId))
    .where(and(scope))
    .orderBy(adminActions.tariffId, desc(adminActions.createdAt), desc(adminActions.adminActionId));
}
