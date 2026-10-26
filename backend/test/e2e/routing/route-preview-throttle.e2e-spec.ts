import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { THROTTLE_ERROR_MESSAGE } from '../../../src/common/constants/http.constants';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import {
  ROUTE_PREVIEW_GUEST_THROTTLE_LIMIT,
  ROUTE_PREVIEW_ROUTES,
  ROUTING_THROTTLE_LIMIT,
} from '../../../src/modules/routing/constants/routing.constants';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { CLIENT_IP_HEADER } from '../../support/constants';
import { MINSK_DELIVERY, MINSK_PICKUP } from '../../support/fixtures';
import { postApi } from '../../support/http';
import { createRoutingMocks, createRoutingTestApp, resetRouting } from '../../support/routing';

const PREVIEW_PATH = `${ROUTE_PREVIEW_ROUTES.BASE}/${ROUTE_PREVIEW_ROUTES.PREVIEW}`;
const VALID_POINTS = { pickup: MINSK_PICKUP, delivery: MINSK_DELIVERY };
// Addresses of their own: the limits are counted by address, and other tests use other ones.
const GUEST_IP = '198.51.100.10';
const USER_IP = '198.51.100.20';

describe('Route preview limits (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const mocks = createRoutingMocks();

  function postPreviewFrom(ip: string, cookies?: string) {
    const request = postApi(app, PREVIEW_PATH).set(CLIENT_IP_HEADER, ip);

    return (cookies === undefined ? request : request.set(COOKIE_HEADER, cookies)).send(
      VALID_POINTS,
    );
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
    await resetRouting(app, db, mocks);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a guest the request over the limit of guests', async () => {
    for (let index = 0; index < ROUTE_PREVIEW_GUEST_THROTTLE_LIMIT; index += 1) {
      await postPreviewFrom(GUEST_IP).expect(HttpStatus.OK);
    }

    const response = await postPreviewFrom(GUEST_IP).expect(HttpStatus.TOO_MANY_REQUESTS);

    expect(response.body.message).toBe(THROTTLE_ERROR_MESSAGE);
    expect(mocks.getRouteGeometry).toHaveBeenCalledTimes(ROUTE_PREVIEW_GUEST_THROTTLE_LIMIT);
  });

  it('should give a signed-in user the limit of users, past the one of guests', async () => {
    const { cookies } = await registerUser(app);

    for (let index = 0; index < ROUTING_THROTTLE_LIMIT; index += 1) {
      await postPreviewFrom(USER_IP, cookies).expect(HttpStatus.OK);
    }

    await postPreviewFrom(USER_IP, cookies).expect(HttpStatus.TOO_MANY_REQUESTS);
  });
});
