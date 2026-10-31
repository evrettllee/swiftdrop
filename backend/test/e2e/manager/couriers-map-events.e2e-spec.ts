import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import {
  staffCourierEventSchema,
  staffCourierLocationEventSchema,
} from '@/modules/realtime/dto/staff-courier-event.dto';
import { addCourierSession } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  CAR,
  COURIER_ACCOUNT,
  createCourier,
  findCourierProfileId,
  placeCourierAt,
  putAvailability,
  putVehicle,
  SECOND_COURIER_ACCOUNT,
} from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { createManager } from '@test/support/manager';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';
import { REPORTED_POINT, sendLocation } from '@test/support/tracking';

const STAFF_EVENTS = [SOCKET_EVENTS.STAFF_COURIER_LOCATION, SOCKET_EVENTS.STAFF_COURIER];

describe('Courier events for the staff (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let manager: Socket;
  let client: Socket;
  const sockets: Socket[] = [];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    manager = await connect(await createManager(app, db));
    client = await connect((await registerUser(app)).cookies);
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.close());
  });

  afterAll(async () => {
    await app.close();
  });

  async function connect(cookies: string): Promise<Socket> {
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    return socket;
  }

  function collectStaffEvents(socket: Socket): unknown[] {
    const events: unknown[] = [];

    for (const event of STAFF_EVENTS) {
      socket.on(event, (payload: unknown) => events.push(payload));
    }

    return events;
  }

  it('should send every stored position of a courier to the staff only', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await placeCourierAt(
      db,
      courier.courierProfileId,
      MINSK_PICKUP,
      new Date(Date.now() - MS_PER_MINUTE),
    );
    const courierSocket = await connect(courier.cookies);
    const position = waitForEvent(manager, SOCKET_EVENTS.STAFF_COURIER_LOCATION);
    const leaked = [...collectStaffEvents(client), ...collectStaffEvents(courierSocket)];

    await expect(sendLocation(courierSocket)).resolves.toEqual({ ok: true });

    const payload = await position;
    expect(staffCourierLocationEventSchema.safeParse(payload).success).toBe(true);
    expect(payload).toEqual({
      courierId: courier.courierProfileId,
      lat: REPORTED_POINT.latitude,
      lng: REPORTED_POINT.longitude,
      at: expect.any(String),
    });

    await roundTrip(client);
    await roundTrip(courierSocket);
    expect(leaked).toEqual([]);
  });

  it('should tell the staff only when a courier goes on and off shift, once per change', async () => {
    const cookies = await createCourier(app, db, SECOND_COURIER_ACCOUNT);
    await putVehicle(app, cookies, CAR).expect(HttpStatus.OK);
    const courierId = await findCourierProfileId(db, SECOND_COURIER_ACCOUNT.email);
    const courierSocket = await connect(cookies);
    const received = collectEvents(manager, SOCKET_EVENTS.STAFF_COURIER);
    const leaked = [...collectStaffEvents(client), ...collectStaffEvents(courierSocket)];

    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    await putAvailability(app, cookies, { isAvailable: true }).expect(HttpStatus.OK);
    await putAvailability(app, cookies, { isAvailable: false }).expect(HttpStatus.OK);
    await roundTrip(manager);
    await roundTrip(client);
    await roundTrip(courierSocket);

    expect(received).toEqual([
      { courierId, kind: 'online' },
      { courierId, kind: 'offline' },
    ]);
    expect(received.every((event) => staffCourierEventSchema.safeParse(event).success)).toBe(true);
    expect(leaked).toEqual([]);
  });
});
