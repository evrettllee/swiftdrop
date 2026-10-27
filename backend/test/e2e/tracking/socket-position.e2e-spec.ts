import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import type { CourierLocationEvent } from '@/modules/couriers/types/courier-location.types';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import { type Cookies, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  joinOrderRoom,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';
import {
  assignTrackedCourier,
  readCourierProfile,
  REPORTED_POINT,
  sendLocation,
} from '@test/support/tracking';

const LOCATION_EVENT = SOCKET_EVENTS.COURIER_LOCATION;

// Negative checks wait for a round trip of the socket that must stay silent: the room gets the
// position right after the acknowledgement of the courier, before the server reads the next packet.
describe('Courier position for the order room (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let orderId: number;
  let courier: { cookies: string; courierProfileId: number };
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
    courier = await assignTrackedCourier(app, db, orderId);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send courier:location to the order owner when the courier has an active order', async () => {
    const client = await sockets.connect(baseUrl, clientCookies);
    const courierSocket = await sockets.connect(baseUrl, courier.cookies);
    await joinOrderRoom(client, { orderId });
    const received = waitForEvent<CourierLocationEvent>(client, LOCATION_EVENT);

    await expect(sendLocation(courierSocket)).resolves.toEqual({ ok: true });

    const profile = await readCourierProfile(db, courier.courierProfileId);
    await expect(received).resolves.toEqual({
      orderId,
      ...REPORTED_POINT,
      updatedAt: profile.locationUpdatedAt?.toISOString(),
    });
  });

  it('should not send courier:location to the courier own sockets', async () => {
    const client = await sockets.connect(baseUrl, clientCookies);
    const sender = await sockets.connect(baseUrl, courier.cookies);
    const otherTab = await sockets.connect(baseUrl, courier.cookies);
    await Promise.all(
      [client, sender, otherTab].map((socket) => joinOrderRoom(socket, { orderId })),
    );
    const senderEvents = collectEvents(sender, LOCATION_EVENT);
    const otherTabEvents = collectEvents(otherTab, LOCATION_EVENT);
    const received = waitForEvent(client, LOCATION_EVENT);

    await sendLocation(sender);

    await received;
    await Promise.all([roundTrip(sender), roundTrip(otherTab)]);
    expect(senderEvents).toEqual([]);
    expect(otherTabEvents).toEqual([]);
  });

  it('should not send courier:location to an outsider', async () => {
    const outsiderCookies = (await registerUser(app, SECOND_CLIENT)).cookies;
    const outsiderOrderId = await placeConfirmedOrder(app, db, outsiderCookies);
    const client = await sockets.connect(baseUrl, clientCookies);
    const outsider = await sockets.connect(baseUrl, outsiderCookies);
    const courierSocket = await sockets.connect(baseUrl, courier.cookies);
    await joinOrderRoom(client, { orderId });
    await joinOrderRoom(outsider, { orderId: outsiderOrderId });
    const outsiderEvents = collectEvents(outsider, LOCATION_EVENT);
    const received = waitForEvent(client, LOCATION_EVENT);

    await sendLocation(courierSocket);

    await received;
    await roundTrip(outsider);
    expect(outsiderEvents).toEqual([]);
  });

  it('should not send courier:location after the order is delivered', async () => {
    const client = await sockets.connect(baseUrl, clientCookies);
    const courierSocket = await sockets.connect(baseUrl, courier.cookies);
    await joinOrderRoom(client, { orderId });
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);
    const clientEvents = collectEvents(client, LOCATION_EVENT);

    await expect(sendLocation(courierSocket)).resolves.toEqual({ ok: true });

    await roundTrip(client);
    expect(clientEvents).toEqual([]);
  });
});
