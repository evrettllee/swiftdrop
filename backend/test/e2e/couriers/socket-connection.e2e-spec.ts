import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { SOCKET_ERRORS } from '../../../src/modules/realtime/constants/realtime.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { createCourier } from '../../support/couriers';
import { resetServiceArea } from '../../support/pricing';
import { connectCourierSocket, listenTestApp } from '../../support/sockets';

const FOREIGN_ORIGIN = 'https://evil.example';

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
});
