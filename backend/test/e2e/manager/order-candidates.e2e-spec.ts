import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  getCourierMe,
  SECOND_COURIER_ACCOUNT,
} from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager } from '@test/support/manager';
import { getCandidates, postAssign } from '@test/support/manager-assignment';
import { type Cookies, placeOrders, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { ADMIN_ACCOUNT, createUserWithRole } from '@test/support/users';

describe('Courier candidates for a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let courier: string;
  let courierId: number;
  let manager: string;
  let orderIds: number[];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: client } = await registerUser(app));
    orderIds = await placeOrders(app, client, 3);
    await setOrderStatus(db, orderIds[0], ORDER_STATUS.CONFIRMED);
    await setOrderStatus(db, orderIds[1], ORDER_STATUS.CONFIRMED);
    ({ courierProfileId: courierId, cookies: courier } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    const offline = await createCourier(app, db, SECOND_COURIER_ACCOUNT);
    await getCourierMe(app, offline).expect(HttpStatus.OK);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should let a manager and an admin in, and keep a client, a courier and a guest out', async () => {
    const admin = await createUserWithRole(app, db, ADMIN_ACCOUNT, ROLE.ADMIN);

    await getCandidates(app, manager, orderIds[0]).expect(HttpStatus.OK);
    await getCandidates(app, admin, orderIds[0]).expect(HttpStatus.OK);
    await getCandidates(app, client, orderIds[0]).expect(HttpStatus.FORBIDDEN);
    await getCandidates(app, courier, orderIds[0]).expect(HttpStatus.FORBIDDEN);
    await getCandidates(app, null, orderIds[0]).expect(HttpStatus.UNAUTHORIZED);
    await postAssign(app, client, orderIds[0], courierId).expect(HttpStatus.FORBIDDEN);
    await postAssign(app, courier, orderIds[0], courierId).expect(HttpStatus.FORBIDDEN);
    await postAssign(app, null, orderIds[0], courierId).expect(HttpStatus.UNAUTHORIZED);
  });

  it('should split the couriers into suitable ones and unsuitable ones with reasons', async () => {
    await insertOffer(db, orderIds[1], courierId);

    const response = await getCandidates(app, manager, orderIds[0]).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      suitable: [
        {
          courierId,
          name: `${COURIER_ACCOUNT.firstName} ${COURIER_ACCOUNT.lastName}`,
          vehicleType: CAR.type,
          pickupDistanceM: 0,
          positionAgeSec: expect.any(Number),
          hasOpenOffer: true,
        },
      ],
      unsuitable: [
        expect.objectContaining({
          name: `${SECOND_COURIER_ACCOUNT.firstName} ${SECOND_COURIER_ACCOUNT.lastName}`,
          vehicleType: null,
          pickupDistanceM: null,
          positionAgeSec: null,
          hasOpenOffer: false,
          reasons: ['offline', 'stale_location', 'no_vehicle'],
        }),
      ],
    });
  });

  it('should search couriers by name and by a local phone number and filter by vehicle', async () => {
    const byName = await getCandidates(app, manager, orderIds[0], { q: 'Новик' });
    const byPhone = await getCandidates(app, manager, orderIds[0], { q: '8 033 111 22 33' });
    const byVehicle = await getCandidates(app, manager, orderIds[0], { vehicleType: 'foot' });

    expect(byName.body).toMatchObject({ suitable: [], unsuitable: [{ hasOpenOffer: false }] });
    expect(byPhone.body).toMatchObject({ suitable: [{ courierId }], unsuitable: [] });
    expect(byVehicle.body).toEqual({ suitable: [], unsuitable: [] });
  });

  it('should answer 404 for a missing order and 409 for an order that cannot be assigned', async () => {
    await getCandidates(app, manager, orderIds[2] + 1000).expect(HttpStatus.NOT_FOUND);

    const response = await getCandidates(app, manager, orderIds[2]).expect(HttpStatus.CONFLICT);

    expect(response.body).toMatchObject({ code: 'ORDER_NOT_ASSIGNABLE' });
  });

  it.each([[{ sort: 'id:asc' }], [{ page: '1' }], [{ vehicleType: 'rocket' }], [{ q: 'Ив' }]])(
    'should refuse %j with 400',
    async (query) => {
      await getCandidates(app, manager, orderIds[0], query).expect(HttpStatus.BAD_REQUEST);
    },
  );
});
