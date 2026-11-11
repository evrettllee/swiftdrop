import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  ORDER_JOIN_MAX_ATTEMPTS,
  ORDER_JOIN_REJECTIONS,
  ORDER_ROOMS_MAX_PER_SOCKET,
} from '@/modules/realtime/constants/realtime.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { OpenSockets, ORDER_JOIN_OK, orderJoinRefusal } from '@test/support/chat';
import { MISSING_ORDER_ID } from '@test/support/constants';
import { type Cookies, placeOrders } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { joinOrderRoom, listenTestApp } from '@test/support/sockets';

describe('Order room limits (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
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
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['a string id', { orderId: String(1) }],
    ['an extra field', { orderId: 1, clientId: 1 }],
    ['no body', null],
  ])('should refuse with invalid when the body is malformed: %s', async (_, body) => {
    const socket = await sockets.connect(baseUrl, clientCookies);

    await expect(joinOrderRoom(socket, body)).resolves.toEqual(
      orderJoinRefusal(ORDER_JOIN_REJECTIONS.INVALID),
    );
  });

  it('should refuse with too_many_rooms after five orders', async () => {
    const orderIds = await placeOrders(app, clientCookies, ORDER_ROOMS_MAX_PER_SOCKET + 1);
    const extraOrderId = orderIds[ORDER_ROOMS_MAX_PER_SOCKET];
    const socket = await sockets.connect(baseUrl, clientCookies);

    for (const orderId of orderIds.slice(0, ORDER_ROOMS_MAX_PER_SOCKET)) {
      await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(ORDER_JOIN_OK);
    }

    await expect(joinOrderRoom(socket, { orderId: extraOrderId })).resolves.toEqual(
      orderJoinRefusal(ORDER_JOIN_REJECTIONS.TOO_MANY_ROOMS),
    );
  });

  it('should refuse with too_frequent after twenty attempts', async () => {
    const [orderId] = await placeOrders(app, clientCookies, 1);
    const socket = await sockets.connect(baseUrl, clientCookies);

    for (let attempt = 0; attempt < ORDER_JOIN_MAX_ATTEMPTS; attempt += 1) {
      await joinOrderRoom(socket, { orderId: MISSING_ORDER_ID });
    }

    await expect(joinOrderRoom(socket, { orderId })).resolves.toEqual(
      orderJoinRefusal(ORDER_JOIN_REJECTIONS.TOO_FREQUENT),
    );
  });
});
