import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import ExcelJS from 'exceljs';
import { SERVICE_FAILURE_CODE as CODE } from '@/common/constants/service-failure-codes.constants';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import type { Database } from '@/database/database.module';
import { ADMIN_ANALYTICS_ROUTES } from '@/modules/admin/constants/admin-analytics.constants';
import { ANALYTICS_EXPORT_ROUTE } from '@/modules/manager/constants/analytics-export.constants';
import { MANAGER_ANALYTICS_ROUTES } from '@/modules/manager/constants/manager-analytics.constants';
import { createAdmin, findUserId } from './admin';
import { buildOrders } from './admin-analytics';
import { insertFailures } from './admin-analytics-blocks';
import { deliveryPlans } from './admin-analytics-delivery-plans';
import { findTariffId, insertZone, zoneIdOf } from './admin-tariffs';
import { COOKIE_HEADER, registerUser, validRegistration } from './auth';
import { TEST_ZONE_NAME } from './constants';
import { COURIER_ACCOUNT, createCourier, findCourierProfileId, getCourierMe } from './couriers';
import { getApi } from './http';
import { createManager } from './manager';
import { resetServiceArea } from './pricing';
import { MANAGER_ACCOUNT } from './users';

export const FORMULA_MESSAGE = '=HYPERLINK("https://swiftdrop.test")';

export const PERSONAL_VALUES = [
  validRegistration.email,
  validRegistration.phone,
  COURIER_ACCOUNT.email,
  COURIER_ACCOUNT.phone,
  COURIER_ACCOUNT.lastName,
  MANAGER_ACCOUNT.email,
];

export type ExportSessions = { admin: string; manager: string };

export async function seedExportAnalytics(
  app: NestExpressApplication,
  db: Database,
  getRoute: jest.Mock,
): Promise<ExportSessions> {
  await resetServiceArea(db, getRoute);
  const admin = await createAdmin(app, db);
  const eastZoneId = await insertZone(db, await findTariffId(db), 'Восток');
  const client = await registerUser(app);
  await getCourierMe(app, await createCourier(app, db)).expect(HttpStatus.OK);
  const manager = await createManager(app, db);
  const actors = {
    client: await findUserId(db, validRegistration.email),
    courier: await findUserId(db, COURIER_ACCOUNT.email),
    courierProfile: await findCourierProfileId(db, COURIER_ACCOUNT.email),
    manager: await findUserId(db, MANAGER_ACCOUNT.email),
  };
  const plans = deliveryPlans(await zoneIdOf(db, TEST_ZONE_NAME), eastZoneId);
  await buildOrders(app, db, client.cookies, actors, plans);
  await insertFailures(db, [
    {
      service: SERVICE_NAME.SERVER,
      code: CODE.server.INTERNAL_ERROR,
      lastAt: '2026-10-03T09:00:00Z',
      repeats: 2,
    },
    {
      service: SERVICE_NAME.NBRB,
      code: CODE.nbrb.SAVED_RATE_USED,
      lastAt: '2026-10-05T09:00:00Z',
      message: FORMULA_MESSAGE,
    },
  ]);

  return { admin, manager };
}

export function getAnalyticsExport(
  app: NestExpressApplication,
  cookies: string | null,
  role: 'admin' | 'manager',
  query: Record<string, string>,
) {
  const base = role === 'admin' ? ADMIN_ANALYTICS_ROUTES.BASE : MANAGER_ANALYTICS_ROUTES.BASE;
  const request = getApi(app, `${base}/${ANALYTICS_EXPORT_ROUTE}`)
    .query(query)
    .responseType('blob');

  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}

export async function readWorkbook(body: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(body as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  return workbook;
}

export function sheetRows(sheet: ExcelJS.Worksheet | undefined): ExcelJS.CellValue[][] {
  const rows: ExcelJS.CellValue[][] = [];

  sheet?.eachRow((row) => {
    rows.push(Array.isArray(row.values) ? row.values.slice(1) : []);
  });

  return rows;
}

export function allText(workbook: ExcelJS.Workbook): string {
  return JSON.stringify(workbook.worksheets.map((sheet) => sheetRows(sheet)));
}
