import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Response } from 'supertest';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { FORBIDDEN_MESSAGE } from '@/modules/auth/constants/access.constants';
import { MANAGER_ANALYTICS_ROUTES } from '@/modules/manager/constants/manager-analytics.constants';
import { getAnalytics } from '@test/support/analytics';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { getCouriersMap } from '@test/support/couriers-map';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager, getManagerExport, getManagerOrders } from '@test/support/manager';
import { postAssign } from '@test/support/manager-assignment';
import { getTariffs, getZones, postZone, WEST_POLYGON } from '@test/support/manager-zones';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { getStaffTickets } from '@test/support/support-tickets';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

type StaffCall = (cookies: string) => Promise<Response>;
type ErrorBody = { message: string };

function messageOf(response: Response): string {
  const body: unknown = response.body;
  const parsed = Buffer.isBuffer(body) ? (JSON.parse(body.toString()) as ErrorBody) : body;

  return (parsed as ErrorBody).message;
}

describe('Admin access to manager features (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let admin: string;
  let manager: string;
  let orderId: number;
  let courierId: number;
  let tariffId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const { cookies: client } = await registerUser(app);
    [orderId] = await placeOrders(app, client, 1);
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    ({ courierProfileId: courierId } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    manager = await createManager(app, db);
    admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);
    [{ id: tariffId }] = (await getTariffs(app, manager).expect(HttpStatus.OK)).body as {
      id: number;
    }[];
  });

  afterAll(async () => {
    await app.close();
  });

  const westZone = () => ({ name: 'Запад', polygon: WEST_POLYGON, tariffId, priority: 5 });

  const staffCalls: [string, StaffCall, HttpStatus][] = [
    ['the orders list', (cookies) => getManagerOrders(app, cookies), HttpStatus.OK],
    [
      'an order assignment',
      (cookies) => postAssign(app, cookies, orderId, courierId),
      HttpStatus.OK,
    ],
    ['the couriers map', (cookies) => getCouriersMap(app, cookies), HttpStatus.OK],
    ['the zones list', (cookies) => getZones(app, cookies), HttpStatus.OK],
    ['a zone creation', (cookies) => postZone(app, cookies, westZone()), HttpStatus.CREATED],
    ['the support queue', (cookies) => getStaffTickets(app, cookies), HttpStatus.OK],
    [
      'the orders export',
      (cookies) => getManagerExport(app, cookies, { format: 'csv' }),
      HttpStatus.OK,
    ],
  ];

  it.each(staffCalls)(
    'should refuse an admin with 403 when the admin calls %s',
    async (_name, call) => {
      const response = await call(admin);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(messageOf(response)).toBe(FORBIDDEN_MESSAGE);
    },
  );

  it.each(staffCalls)(
    'should still serve a manager when the manager calls %s',
    async (_name, call, status) => {
      const response = await call(manager);

      expect(response.status).toBe(status);
    },
  );

  it.each([MANAGER_ANALYTICS_ROUTES.SUMMARY, MANAGER_ANALYTICS_ROUTES.COURIERS])(
    'should refuse an admin with 403 on the manager analytics %s',
    async (route) => {
      const response = await getAnalytics(app, admin, route).expect(HttpStatus.FORBIDDEN);

      expect(messageOf(response)).toBe(FORBIDDEN_MESSAGE);
      await getAnalytics(app, manager, route).expect(HttpStatus.OK);
    },
  );
});
