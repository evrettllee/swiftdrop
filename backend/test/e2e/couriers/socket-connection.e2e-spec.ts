import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ROLE, type RoleName } from '@/common/enums/role.enum';
import { ENV_KEYS } from '@/config/env.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { users } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ACCESS_COOKIE_NAME } from '@/modules/auth/constants/tokens.constants';
import { LOCATION_UPDATE_REJECTIONS } from '@/modules/couriers/constants/courier-location.constants';
import {
  ORDER_JOIN_REJECTIONS,
  SOCKET_ERRORS,
} from '@/modules/realtime/constants/realtime.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { createTestApp } from '@test/support/app';
import { registerUser, validRegistration } from '@test/support/auth';
import { COURIER_ACCOUNT, createCourier } from '@test/support/couriers';
import { resetServiceArea } from '@test/support/pricing';
import {
  connectAppSocket,
  joinOrderRoom,
  listenTestApp,
  waitForEvent,
} from '@test/support/sockets';
import { sendLocation } from '@test/support/tracking';
import { ADMIN_ACCOUNT, createUserWithRole, MANAGER_ACCOUNT } from '@test/support/users';

const FOREIGN_ORIGIN = 'https://evil.example';
const STAFF_TEST_EVENT = 'staff:test';
// The access token of the test lives this long, so the server closes the socket within the wait.
const SHORT_SESSION_SECONDS = 2;
const DISCONNECT_EVENT = 'disconnect';
// The reason socket.io gives when the server itself closed the connection.
const SERVER_DISCONNECT_REASON = 'io server disconnect';

describe('App socket connection (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  const getRoute = jest.fn();
  const sockets: Socket[] = [];

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.close());
  });

  afterAll(async () => {
    await app.close();
  });

  // Signed like the server signs access tokens, only with a much shorter life.
  async function shortSessionCookie(email: string, role: RoleName): Promise<string> {
    const [user] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.email, email));
    const token = await new JwtService().signAsync(
      { sub: String(user.userId), role },
      {
        secret: app.get(ConfigService).getOrThrow<string>(ENV_KEYS.JWT_ACCESS_SECRET),
        expiresIn: SHORT_SESSION_SECONDS,
      },
    );

    return `${ACCESS_COOKIE_NAME}=${token}`;
  }

  it('should connect the courier when the session is valid', async () => {
    const cookies = await createCourier(app, db);

    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    expect(socket.connected).toBe(true);
  });

  it('should admit a client when a client account connects', async () => {
    const { cookies } = await registerUser(app);

    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    expect(socket.connected).toBe(true);
  });

  it.each([
    [ROLE.MANAGER, MANAGER_ACCOUNT],
    [ROLE.ADMIN, ADMIN_ACCOUNT],
  ])('should admit a %s into the staff room only', async (role, account) => {
    const cookies = await createUserWithRole(app, db, account, role);
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);
    const received = waitForEvent<{ ok: boolean }>(socket, STAFF_TEST_EVENT);

    app.get(RealtimeEventsService).toStaff(STAFF_TEST_EVENT, { ok: true });

    await expect(received).resolves.toEqual({ ok: true });
    await expect(joinOrderRoom(socket, { orderId: 1 })).resolves.toEqual({
      ok: false,
      reason: ORDER_JOIN_REJECTIONS.NOT_FOUND,
    });
    await expect(sendLocation(socket)).resolves.toEqual({
      ok: false,
      reason: LOCATION_UPDATE_REJECTIONS.FORBIDDEN,
    });
  });

  it('should refuse the connection when there is no session cookie', async () => {
    await expect(connectAppSocket(baseUrl, '')).rejects.toThrow(SOCKET_ERRORS.UNAUTHORIZED);
  });

  it('should refuse the connection when it comes from a foreign page', async () => {
    const cookies = await createCourier(app, db);

    await expect(connectAppSocket(baseUrl, cookies, FOREIGN_ORIGIN)).rejects.toThrow(
      SOCKET_ERRORS.ORIGIN_NOT_ALLOWED,
    );
  });

  it('should close the socket from the server when the session expires', async () => {
    await createCourier(app, db);
    const cookies = await shortSessionCookie(COURIER_ACCOUNT.email, ROLE.COURIER);
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    const reason = await waitForEvent<string>(socket, DISCONNECT_EVENT);

    expect(reason).toBe(SERVER_DISCONNECT_REASON);
  });

  it('should close a client socket when the session expires', async () => {
    await registerUser(app);
    const cookies = await shortSessionCookie(validRegistration.email, ROLE.CLIENT);
    const socket = await connectAppSocket(baseUrl, cookies);
    sockets.push(socket);

    const reason = await waitForEvent<string>(socket, DISCONNECT_EVENT);

    expect(reason).toBe(SERVER_DISCONNECT_REASON);
  });
});
