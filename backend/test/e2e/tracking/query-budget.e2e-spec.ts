import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Pool } from 'pg';
import { DRIZZLE, PG_POOL } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { CLIENT_ORDER_COURIER_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM, ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { ETA_SHUTDOWN_WAIT_MS } from '@/modules/tracking/constants/tracking.constants';
import { OrderEtaStore } from '@/modules/tracking/services/order-eta-store.service';
import { OrderEtaService } from '@/modules/tracking/services/order-eta.service';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { getChatHistory, OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { getApi } from '@test/support/http';
import { createRoutingMocks, createRoutingTestApp, resetRouting } from '@test/support/routing';
import { collectEvents, joinOrderRoom, listenTestApp, roundTrip } from '@test/support/sockets';
import { assignTrackedCourier, sendLocation } from '@test/support/tracking';

// Open tabs of one client, all in the room of the order.
const CLIENT_TABS = 5;

// How many queries the hot paths of tracking and chat send to the database. A change that adds a
// query to a path that runs for every position or every page shows up here.
describe('Database queries per request (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let cookies: string;
  let orderId: number;
  let courier: { cookies: string; courierProfileId: number };
  let queries: jest.SpyInstance;
  const sockets = new OpenSockets();
  const mocks = createRoutingMocks();

  // Counts the queries `work` sends outside transactions, the only kind these paths use.
  async function countQueries(work: () => Promise<unknown>): Promise<number> {
    queries.mockClear();
    await work();

    return queries.mock.calls.length;
  }

  function orderPath(route: string): string {
    return `${CLIENT_ORDER_COURIER_ROUTES.BASE}/${route.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    ({ cookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, cookies);
    courier = await assignTrackedCourier(app, db, orderId);
    // An estimate made just now: the positions below ask for none, so only their own queries count.
    app.get(OrderEtaStore).ensure(orderId).computedAtMs = Date.now();
    queries = jest.spyOn(app.get<Pool>(PG_POOL), 'query');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should store a position with one query and refuse one with two', async () => {
    const first = await sockets.connect(baseUrl, courier.cookies);
    const second = await sockets.connect(baseUrl, courier.cookies);

    expect(await countQueries(() => sendLocation(first))).toBe(1);
    // Another socket of the same courier within 5 seconds: the database refuses and tells why.
    expect(await countQueries(() => sendLocation(second))).toBe(2);
    // The same socket within 5 seconds: refused by the socket, no query at all.
    expect(await countQueries(() => sendLocation(first))).toBe(0);
  });

  // socket.io encodes a room message once and writes it to each socket: the cost grows with the
  // sockets of the room, never with queries.
  it('should send one position to every tab of the room with one query', async () => {
    const tabs = await Promise.all(
      Array.from({ length: CLIENT_TABS }, () => sockets.connect(baseUrl, cookies)),
    );
    await Promise.all(tabs.map((tab) => joinOrderRoom(tab, { orderId })));
    const received = tabs.map((tab) => collectEvents(tab, SOCKET_EVENTS.COURIER_LOCATION));
    const socket = await sockets.connect(baseUrl, courier.cookies);

    expect(await countQueries(() => sendLocation(socket))).toBe(1);

    await Promise.all(tabs.map((tab) => roundTrip(tab)));
    expect(received.map((events) => events.length)).toEqual(tabs.map(() => 1));
  });

  // While the routing service is down every position asks for an estimate that cannot be made:
  // it is skipped before the order is read, so the position costs only its own query.
  it('should read nothing for an estimate while the routing service is down', async () => {
    mocks.isTripAvailable.mockReturnValue(false);
    app.get(OrderEtaStore).delete(orderId);
    const socket = await sockets.connect(baseUrl, courier.cookies);

    const count = await countQueries(async () => {
      await sendLocation(socket);
      await new Promise(setImmediate);
      await app.get(OrderEtaService).waitForIdle(ETA_SHUTDOWN_WAIT_MS);
    });

    expect(count).toBe(1);
  });

  it('should open the order page of the client with a known number of queries', async () => {
    const socket = await sockets.connect(baseUrl, cookies);
    const get = (path: string) =>
      getApi(app, path).set(COOKIE_HEADER, cookies).expect(HttpStatus.OK);

    const perStep = {
      details: await countQueries(() => get(`${ORDERS_ROUTES.BASE}/${orderId}`)),
      courier: await countQueries(() => get(orderPath(CLIENT_ORDER_COURIER_ROUTES.COURIER))),
      route: await countQueries(() => get(orderPath(CLIENT_ORDER_COURIER_ROUTES.ROUTE))),
      messages: await countQueries(() =>
        getChatHistory(app, cookies, orderId).expect(HttpStatus.OK),
      ),
      join: await countQueries(() => joinOrderRoom(socket, { orderId })),
    };

    // Each HTTP request also reads its user in the session guard: one query of every count.
    expect(perStep).toEqual({ details: 5, courier: 2, route: 2, messages: 4, join: 1 });
  });
});
