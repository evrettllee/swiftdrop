import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_SOCKET_EVENTS,
  LOCATION_UPDATE_REJECTIONS,
} from '@/modules/couriers/constants/couriers-socket.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { OpenSockets, placeConfirmedOrder } from '@test/support/chat';
import {
  CAR,
  createCourier,
  findCourierProfileId,
  COURIER_ACCOUNT,
  putVehicle,
} from '@test/support/couriers';
import { resetServiceArea } from '@test/support/pricing';
import { joinOrderRoom, listenTestApp, waitForEvent } from '@test/support/sockets';
import {
  assignTrackedCourier,
  readCourierProfile,
  REPORTED_POINT,
  sendLocation,
} from '@test/support/tracking';

describe('Courier position storage (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  // Going off shift with an active order is refused now, so the API cannot reach this state; it
  // remains for profiles that were left so before the refusal existed.
  it('should store location when the courier has an active order and is_available is false', async () => {
    const { cookies: clientCookies } = await registerUser(app);
    const orderId = await placeConfirmedOrder(app, db, clientCookies);
    const courier = await assignTrackedCourier(app, db, orderId);
    await db
      .update(courierProfiles)
      .set({ isAvailable: false })
      .where(eq(courierProfiles.courierProfileId, courier.courierProfileId));
    const client = await sockets.connect(baseUrl, clientCookies);
    const courierSocket = await sockets.connect(baseUrl, courier.cookies);
    await joinOrderRoom(client, { orderId });
    const received = waitForEvent(client, COURIER_SOCKET_EVENTS.COURIER_LOCATION);

    await expect(sendLocation(courierSocket)).resolves.toEqual({ ok: true });

    await received;
    const profile = await readCourierProfile(db, courier.courierProfileId);
    expect(profile.currentLat).toBe(REPORTED_POINT.latitude);
    expect(profile.currentLng).toBe(REPORTED_POINT.longitude);
  });

  it('should reply too_frequent when two sockets of one courier send within 5 seconds', async () => {
    const { cookies: clientCookies } = await registerUser(app);
    const orderId = await placeConfirmedOrder(app, db, clientCookies);
    const courier = await assignTrackedCourier(app, db, orderId);
    const firstTab = await sockets.connect(baseUrl, courier.cookies);
    const secondTab = await sockets.connect(baseUrl, courier.cookies);

    await expect(sendLocation(firstTab)).resolves.toEqual({ ok: true });

    await expect(sendLocation(secondTab)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.TOO_FREQUENT,
    });
  });

  it('should reply off_shift when the courier is off shift without an active order', async () => {
    const cookies = await createCourier(app, db);
    await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);
    const socket = await sockets.connect(baseUrl, cookies);

    await expect(sendLocation(socket)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.OFF_SHIFT,
    });
    const profile = await readCourierProfile(
      db,
      await findCourierProfileId(db, COURIER_ACCOUNT.email),
    );
    expect(profile.currentLat).toBeNull();
  });
});
