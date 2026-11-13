import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { adminActions, serviceZones, tariffs } from '@/database/schema';
import { ADMIN_ROUTES } from '@/modules/admin/constants/admin-users.constants';
import { withCookies } from './admin';
import { TEST_TARIFF, TEST_ZONE_POLYGON } from './constants';
import { getApi, patchApi, postApi } from './http';

const TARIFFS_PATH = `${ADMIN_ROUTES.BASE}/tariffs`;

export const EXPRESS_TARIFF = {
  name: 'Экспресс',
  pricePerKm: 1.5,
  pricePerKg: 0.75,
  minPrice: 8,
  fragileFee: 3.25,
};

export function getAdminTariffs(app: NestExpressApplication, cookies: string | null) {
  return withCookies(getApi(app, TARIFFS_PATH), cookies);
}

export function postTariff(app: NestExpressApplication, cookies: string | null, body: object) {
  return withCookies(postApi(app, TARIFFS_PATH).send(body), cookies);
}

export function patchTariff(
  app: NestExpressApplication,
  cookies: string | null,
  tariffId: number,
  body: object,
) {
  return withCookies(patchApi(app, `${TARIFFS_PATH}/${tariffId}`).send(body), cookies);
}

export function postTariffStatus(
  app: NestExpressApplication,
  cookies: string | null,
  tariffId: number,
  body: object,
) {
  return withCookies(postApi(app, `${TARIFFS_PATH}/${tariffId}/status`).send(body), cookies);
}

export async function findTariffId(db: Database, name = TEST_TARIFF.name): Promise<number> {
  const [tariff] = await db
    .select({ tariffId: tariffs.tariffId })
    .from(tariffs)
    .where(eq(tariffs.name, name));

  return tariff.tariffId;
}

export function findTariffActions(db: Database, tariffId: number) {
  return db
    .select({ action: adminActions.action, details: adminActions.details })
    .from(adminActions)
    .where(eq(adminActions.tariffId, tariffId))
    .orderBy(asc(adminActions.adminActionId));
}

export async function insertZone(
  db: Database,
  tariffId: number,
  name: string,
  isActive = true,
): Promise<number> {
  const [zone] = await db
    .insert(serviceZones)
    .values({ name, polygon: TEST_ZONE_POLYGON, tariffId, isActive, priority: 1 })
    .returning({ zoneId: serviceZones.zoneId });

  return zone.zoneId;
}

export async function insertTariff(db: Database, name: string, isActive = true): Promise<number> {
  const [tariff] = await db
    .insert(tariffs)
    .values({ ...TEST_TARIFF, name, isActive })
    .returning({ tariffId: tariffs.tariffId });

  return tariff.tariffId;
}
