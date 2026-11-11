import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ORDER_JOIN_REJECTIONS } from '@/modules/realtime/constants/realtime.constants';
import { OrderRoomsService } from '@/modules/realtime/services/order-rooms.service';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { registerUser } from '@test/support/auth';
import {
  assignCourier,
  OpenSockets,
  ORDER_JOIN_OK,
  orderJoinRefusal,
  placeConfirmedOrder,
} from '@test/support/chat';
import { MISSING_ORDER_ID } from '@test/support/constants';
import { CAR, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { type Cookies, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { joinOrderRoom, listenTestApp } from '@test/support/sockets';

const NOT_FOUND = orderJoinRefusal(ORDER_JOIN_REJECTIONS.NOT_FOUND);

describe('Order room access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let orderId: number;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should join when the client owns the order', async () => {
    const socket = await sockets.connect(baseUrl, clientCookies);

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(ORDER_JOIN_OK);
  });

  it('should join when the courier is assigned to the order', async () => {
    const { cookies } = await assignCourier(app, db, orderId);
    const socket = await sockets.connect(baseUrl, cookies);

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(ORDER_JOIN_OK);
  });

  it('should join when the order is delivered', async () => {
    const { cookies } = await assignCourier(app, db, orderId);
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);
    const client = await sockets.connect(baseUrl, clientCookies);
    const courier = await sockets.connect(baseUrl, cookies);

    await expect(joinOrderRoom(client, { orderId })).resolves.toEqual(ORDER_JOIN_OK);
    await expect(joinOrderRoom(courier, { orderId })).resolves.toEqual(ORDER_JOIN_OK);
  });

  it('should answer ok without a new check when the room is already joined', async () => {
    const socket = await sockets.connect(baseUrl, clientCookies);
    await joinOrderRoom(socket, { orderId });
    const check = jest.spyOn(app.get(OrderRoomsService), 'participantAccess');

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(ORDER_JOIN_OK);
    expect(check).not.toHaveBeenCalled();
  });

  it('should refuse with not_found when the order belongs to another client', async () => {
    const { cookies } = await registerUser(app, SECOND_CLIENT);
    const socket = await sockets.connect(baseUrl, cookies);

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(NOT_FOUND);
  });

  it('should refuse with not_found when the order does not exist', async () => {
    const socket = await sockets.connect(baseUrl, clientCookies);

    await expect(joinOrderRoom(socket, { orderId: MISSING_ORDER_ID })).resolves.toEqual(NOT_FOUND);
  });

  it('should refuse with not_found when the courier is not assigned', async () => {
    await assignCourier(app, db, orderId);
    const other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    const socket = await sockets.connect(baseUrl, other.cookies);

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(NOT_FOUND);
  });
});
