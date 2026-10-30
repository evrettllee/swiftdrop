import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { MANAGER_EXPORT_ROW_LIMIT } from '@/modules/manager/constants/manager-export.constants';
import { ManagerExportLimits } from '@/modules/manager/services/manager-export-limits';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createCourier } from '@test/support/couriers';
import { createManager, csvLines, getManagerExport } from '@test/support/manager';
import { type Cookies, placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

const FILE_NAME = /^swiftdrop-orders-\d{4}-\d{2}-\d{2}\.(csv|xlsx)$/;

describe('Manager orders export access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let manager: string;
  const limits = { rowLimit: MANAGER_EXPORT_ROW_LIMIT };
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: ManagerExportLimits, useValue: limits },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    limits.rowLimit = MANAGER_EXPORT_ROW_LIMIT;
    await resetServiceArea(db, getRoute);
    ({ cookies: client } = await registerUser(app));
    await placeOrders(app, client, 3);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  function fileNameOf(disposition: string): string {
    return /filename="([^"]+)"/.exec(disposition)?.[1] ?? '';
  }

  it.each([
    ['csv', 'text/csv; charset=utf-8'],
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ])('should give a manager the %s file with safe headers', async (format, contentType) => {
    const response = await getManagerExport(app, manager, { format }).expect(HttpStatus.OK);
    const disposition = String(response.headers['content-disposition']);

    expect(response.headers['content-type']).toBe(contentType);
    expect(disposition).toMatch(/^attachment; filename="[^"]+"; filename\*=UTF-8''/);
    expect(fileNameOf(disposition)).toMatch(FILE_NAME);
    expect(fileNameOf(disposition).endsWith(`.${format}`)).toBe(true);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should give an admin the export too', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);

    const response = await getManagerExport(app, admin, { format: 'csv' }).expect(HttpStatus.OK);

    expect(csvLines(response.body as Buffer)).toHaveLength(4);
  });

  it('should refuse a client and a courier with 403 and a guest with 401', async () => {
    const courier = await createCourier(app, db);

    await getManagerExport(app, client, { format: 'csv' }).expect(HttpStatus.FORBIDDEN);
    await getManagerExport(app, courier, { format: 'csv' }).expect(HttpStatus.FORBIDDEN);
    await getManagerExport(app, null, { format: 'csv' }).expect(HttpStatus.UNAUTHORIZED);
  });

  it.each([
    [{}],
    [{ format: 'csv', page: 1 }],
    [{ format: 'csv', limit: 10 }],
    [{ format: 'csv', cursor: '' }],
  ])('should refuse %j with 400', async (query) => {
    await getManagerExport(app, manager, query).expect(HttpStatus.BAD_REQUEST);
  });

  it('should ask to narrow the filter when there are more rows than the limit', async () => {
    limits.rowLimit = 2;

    const response = await getManagerExport(app, manager, { format: 'xlsx' }).expect(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(JSON.parse((response.body as Buffer).toString('utf8'))).toMatchObject({
      code: 'EXPORT_TOO_LARGE',
      total: 3,
    });
  });
});
