import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_SOCKET_EVENTS,
  LOCATION_UPDATE_REJECTIONS,
} from '@/modules/couriers/constants/couriers-socket.constants';
import type { LocationAck } from '@/modules/couriers/types/couriers-socket.types';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { CAR, createCourier, putAvailability, putVehicle } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { resetServiceArea } from '@test/support/pricing';
import { connectAppSocket, emitWithAck, listenTestApp } from '@test/support/sockets';

const INVALID_LATITUDE = 91;

describe('Courier socket location (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let cookies: string;
  let socket: Socket;
  const getRoute = jest.fn();

  function sendLocation(body: unknown): Promise<LocationAck> {
    return emitWithAck<LocationAck>(socket, COURIER_SOCKET_EVENTS.LOCATION_UPDATE, body);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    cookies = await createCourier(app, db);
    await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);
  });

  afterEach(() => {
    socket?.close();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should save the position when the courier is on shift', async () => {
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    socket = await connectAppSocket(baseUrl, cookies);

    const ack = await sendLocation(MINSK_PICKUP);

    const [profile] = await db.select().from(courierProfiles);
    expect(ack).toEqual({ ok: true });
    expect(profile.currentLat).toBe(MINSK_PICKUP.latitude);
    expect(profile.currentLng).toBe(MINSK_PICKUP.longitude);
    expect(profile.locationUpdatedAt).not.toBeNull();
  });

  it('should not save the position when the courier is off shift', async () => {
    socket = await connectAppSocket(baseUrl, cookies);

    const ack = await sendLocation(MINSK_PICKUP);

    const [profile] = await db.select().from(courierProfiles);
    expect(ack).toEqual({ ok: false, reason: LOCATION_UPDATE_REJECTIONS.OFF_SHIFT });
    expect(profile.currentLat).toBeNull();
  });

  it('should reject the position when the latitude is out of range', async () => {
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    socket = await connectAppSocket(baseUrl, cookies);

    const ack = await sendLocation({ ...MINSK_PICKUP, latitude: INVALID_LATITUDE });

    expect(ack).toEqual({ ok: false, reason: LOCATION_UPDATE_REJECTIONS.INVALID_LOCATION });
  });

  it('should reject location update when the sender is a client', async () => {
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    const client = await registerUser(app);
    socket = await connectAppSocket(baseUrl, client.cookies);

    const ack = await sendLocation(MINSK_PICKUP);

    const profiles = await db.select().from(courierProfiles);
    expect(ack).toEqual({ ok: false, reason: LOCATION_UPDATE_REJECTIONS.FORBIDDEN });
    expect(profiles.every((profile) => profile.currentLat === null)).toBe(true);
  });

  it('should reject the second position when it comes too soon after the first', async () => {
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    socket = await connectAppSocket(baseUrl, cookies);
    await sendLocation(MINSK_PICKUP);

    const ack = await sendLocation(MINSK_PICKUP);

    expect(ack).toEqual({ ok: false, reason: LOCATION_UPDATE_REJECTIONS.TOO_FREQUENT });
  });
});
