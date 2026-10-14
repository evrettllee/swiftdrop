import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { ROLE } from '../../../src/common/enums/role.enum';
import { ENV_KEYS } from '../../../src/config/env.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { users } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { ACCESS_COOKIE_NAME } from '../../../src/modules/auth/constants/tokens.constants';
import { SOCKET_ERRORS } from '../../../src/modules/realtime/constants/realtime.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { COURIER_ACCOUNT, createCourier } from '../../support/couriers';
import { resetServiceArea } from '../../support/pricing';
import { connectCourierSocket, listenTestApp, waitForEvent } from '../../support/sockets';

const FOREIGN_ORIGIN = 'https://evil.example';
// The access token of the test lives this long, so the server closes the socket within the wait.
const SHORT_SESSION_SECONDS = 2;
const DISCONNECT_EVENT = 'disconnect';
// The reason socket.io gives when the server itself closed the connection.
const SERVER_DISCONNECT_REASON = 'io server disconnect';

describe('Courier socket connection (e2e)', () => {
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
  async function shortSessionCookie(): Promise<string> {
    const [user] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.email, COURIER_ACCOUNT.email));
    const token = await new JwtService().signAsync(
      { sub: String(user.userId), role: ROLE.COURIER },
      {
        secret: app.get(ConfigService).getOrThrow<string>(ENV_KEYS.JWT_ACCESS_SECRET),
        expiresIn: SHORT_SESSION_SECONDS,
      },
    );

    return `${ACCESS_COOKIE_NAME}=${token}`;
  }

  it('should connect the courier when the session is valid', async () => {
    const cookies = await createCourier(app, db);

    const socket = await connectCourierSocket(baseUrl, cookies);
    sockets.push(socket);

    expect(socket.connected).toBe(true);
  });

  it('should refuse a client when a client account connects', async () => {
    const { cookies } = await registerUser(app);

    await expect(connectCourierSocket(baseUrl, cookies)).rejects.toThrow(
      SOCKET_ERRORS.UNAUTHORIZED,
    );
  });

  it('should refuse the connection when there is no session cookie', async () => {
    await expect(connectCourierSocket(baseUrl, '')).rejects.toThrow(SOCKET_ERRORS.UNAUTHORIZED);
  });

  it('should refuse the connection when it comes from a foreign page', async () => {
    const cookies = await createCourier(app, db);

    await expect(connectCourierSocket(baseUrl, cookies, FOREIGN_ORIGIN)).rejects.toThrow(
      SOCKET_ERRORS.ORIGIN_NOT_ALLOWED,
    );
  });

  it('should close the socket from the server when the session expires', async () => {
    await createCourier(app, db);
    const socket = await connectCourierSocket(baseUrl, await shortSessionCookie());
    sockets.push(socket);

    const reason = await waitForEvent<string>(socket, DISCONNECT_EVENT);

    expect(reason).toBe(SERVER_DISCONNECT_REASON);
  });
});
