import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { staffZoneEventSchema } from '@/modules/realtime/dto/staff-zone-event.dto';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { sortedStatuses } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { getZones, patchZone, postZone, WEST_POLYGON } from '@test/support/manager-zones';
import { resetServiceArea } from '@test/support/pricing';
import {
  collectEvents,
  connectAppSocket,
  listenTestApp,
  roundTrip,
  waitForEvent,
} from '@test/support/sockets';

type Zone = { id: number; updatedAt: string; isActive: boolean };

const CONFLICT_PAIR = [HttpStatus.OK, HttpStatus.CONFLICT];

describe('Service zones under concurrent changes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let manager: string;
  let zones: Zone[];
  const sockets: Socket[] = [];
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    manager = await createManager(app, db);
    await postZone(app, manager, { name: 'Запад', polygon: WEST_POLYGON, tariffId: 1 }).expect(
      HttpStatus.CREATED,
    );
    zones = (await getZones(app, manager).expect(HttpStatus.OK)).body as Zone[];
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

  it('should let only one of two last active zones be switched off', async () => {
    const responses = await Promise.all(
      zones.map((zone) =>
        patchZone(app, manager, zone.id, { isActive: false, expectedUpdatedAt: zone.updatedAt }),
      ),
    );
    const refused = responses.find((response) => response.status === HttpStatus.CONFLICT);
    const after = (await getZones(app, manager).expect(HttpStatus.OK)).body as Zone[];

    expect(sortedStatuses(responses)).toEqual(CONFLICT_PAIR);
    expect(refused?.body).toMatchObject({ code: 'LAST_ACTIVE_ZONE' });
    expect(after.filter((zone) => zone.isActive)).toHaveLength(1);
  });

  it('should let only one of two changes from the same version through', async () => {
    const [zone] = zones;

    const responses = await Promise.all(
      [10, 20].map((priority) =>
        patchZone(app, manager, zone.id, { priority, expectedUpdatedAt: zone.updatedAt }),
      ),
    );
    const refused = responses.find((response) => response.status === HttpStatus.CONFLICT);
    const saved = responses.find((response) => response.status === HttpStatus.OK);

    expect(sortedStatuses(responses)).toEqual(CONFLICT_PAIR);
    expect(refused?.body).toMatchObject({ code: 'ZONE_CHANGED', updatedAt: saved?.body.updatedAt });
  });

  it('should tell the staff about a saved zone and nobody else', async () => {
    const [zone] = zones;
    const staffSocket = await connect(manager);
    const clientSocket = await connect((await registerUser(app)).cookies);
    const received = waitForEvent(staffSocket, SOCKET_EVENTS.STAFF_ZONE);
    const leaked = collectEvents(clientSocket, SOCKET_EVENTS.STAFF_ZONE);

    await patchZone(app, manager, zone.id, {
      priority: 7,
      expectedUpdatedAt: zone.updatedAt,
    }).expect(HttpStatus.OK);

    const event = await received;
    expect(event).toEqual({ zoneId: zone.id });
    expect(staffZoneEventSchema.safeParse(event).success).toBe(true);
    await roundTrip(clientSocket);
    expect(leaked).toEqual([]);
  });
});
