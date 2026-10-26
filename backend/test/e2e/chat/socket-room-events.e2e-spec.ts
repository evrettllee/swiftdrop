import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CouriersGateway } from '@/modules/couriers/gateways/couriers.gateway';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { assignCourier, OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { type Cookies, SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';

// An event no part of the app sends: only the test emits it through the gateway.
const TEST_EVENT = 'test:order-event';
const TEST_PAYLOAD = { hello: 'order' };

describe('Order room events (e2e)', () => {
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
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should deliver an emitToOrder event to the client and courier but not to an outsider', async () => {
    const courier = await assignCourier(app, db, orderId);
    const outsiderCookies = (await registerUser(app, SECOND_CLIENT)).cookies;
    const outsiderOrderId = await placeConfirmedOrder(app, db, outsiderCookies);
    const client = await sockets.connect(baseUrl, clientCookies);
    const courierSocket = await sockets.connect(baseUrl, courier.cookies);
    const outsider = await sockets.connect(baseUrl, outsiderCookies);
    await joinOrderRoom(client, { orderId });
    await joinOrderRoom(courierSocket, { orderId });
    await joinOrderRoom(outsider, { orderId: outsiderOrderId });
    const outsiderEvents = collectEvents(outsider, TEST_EVENT);
    const clientEvent = waitForEvent(client, TEST_EVENT);
    const courierEvent = waitForEvent(courierSocket, TEST_EVENT);

    app.get(CouriersGateway).emitToOrder(orderId, TEST_EVENT, TEST_PAYLOAD);

    await expect(clientEvent).resolves.toEqual(TEST_PAYLOAD);
    await expect(courierEvent).resolves.toEqual(TEST_PAYLOAD);
    await roundTrip(outsider);
    expect(outsiderEvents).toEqual([]);
  });

  it('should skip the courier sockets when exceptCourierProfileId is set', async () => {
    const courier = await assignCourier(app, db, orderId);
    const client = await sockets.connect(baseUrl, clientCookies);
    const courierSocket = await sockets.connect(baseUrl, courier.cookies);
    await joinOrderRoom(client, { orderId });
    await joinOrderRoom(courierSocket, { orderId });
    const courierEvents = collectEvents(courierSocket, TEST_EVENT);
    const clientEvent = waitForEvent(client, TEST_EVENT);

    app.get(CouriersGateway).emitToOrder(orderId, TEST_EVENT, TEST_PAYLOAD, {
      exceptCourierProfileId: courier.courierProfileId,
    });

    await expect(clientEvent).resolves.toEqual(TEST_PAYLOAD);
    await roundTrip(courierSocket);
    expect(courierEvents).toEqual([]);
  });
});
