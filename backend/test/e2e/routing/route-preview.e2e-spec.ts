import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OSRM_PROFILE } from '../../../src/integrations/osrm/constants/osrm.constants';
import { PRICING_ERROR_MESSAGES } from '../../../src/modules/pricing/constants/pricing.constants';
import {
  ROUTE_PREVIEW_ROUTES,
  ROUTE_SEGMENT_KIND,
} from '../../../src/modules/routing/constants/routing.constants';
import { accessCookie, COOKIE_HEADER, registerUser } from '../../support/auth';
import { CAR, COURIER_ACCOUNT } from '../../support/couriers';
import { addCourierSession } from '../../support/assignment';
import { MINSK_DELIVERY, MINSK_PICKUP, MOSCOW } from '../../support/fixtures';
import { postApi } from '../../support/http';
import type { Cookies } from '../../support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  failRouting,
  lineThrough,
  resetRouting,
} from '../../support/routing';

const PREVIEW_PATH = `${ROUTE_PREVIEW_ROUTES.BASE}/${ROUTE_PREVIEW_ROUTES.PREVIEW}`;
const VALID_POINTS = { pickup: MINSK_PICKUP, delivery: MINSK_DELIVERY };
const BROKEN_SESSION = accessCookie('not-a-token');

describe('Route preview of the calculator (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  const mocks = createRoutingMocks();

  function postPreview(body: Record<string, unknown>, sessionCookies?: Cookies) {
    const request = postApi(app, PREVIEW_PATH);

    return (
      sessionCookies === undefined ? request : request.set(COOKIE_HEADER, sessionCookies)
    ).send(body);
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(db, mocks);
    ({ cookies } = await registerUser(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should route the pickup point to the delivery point by car', async () => {
    const response = await postPreview(VALID_POINTS, cookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
          geometry: lineThrough([MINSK_PICKUP, MINSK_DELIVERY]),
        },
      ],
    });
    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(
      [MINSK_PICKUP, MINSK_DELIVERY],
      OSRM_PROFILE.CAR,
    );
  });

  it('should return no line when the routing service is unavailable', async () => {
    failRouting(mocks);

    const response = await postPreview(VALID_POINTS, cookies).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [{ kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, geometry: null }],
    });
  });

  it('should serve any signed-in user, a courier too', async () => {
    const courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, COURIER_POINT);

    await postPreview(VALID_POINTS, courier.cookies).expect(HttpStatus.OK);
  });

  it('should route for a guest, the calculator of the landing', async () => {
    const response = await postPreview(VALID_POINTS).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      segments: [
        {
          kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
          geometry: lineThrough([MINSK_PICKUP, MINSK_DELIVERY]),
        },
      ],
    });
  });

  it('should serve a broken session as a guest instead of refusing it', async () => {
    await postPreview(VALID_POINTS, BROKEN_SESSION).expect(HttpStatus.OK);
  });

  it('should route by car whatever profile the request names', async () => {
    await postPreview({ ...VALID_POINTS, profile: OSRM_PROFILE.FOOT }).expect(HttpStatus.OK);

    expect(mocks.getRouteGeometry).toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.CAR);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalledWith(expect.any(Array), OSRM_PROFILE.FOOT);
  });

  it('should refuse a pickup point outside the service area', async () => {
    const response = await postPreview({ ...VALID_POINTS, pickup: MOSCOW }).expect(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });

  it('should refuse a delivery point outside the service area', async () => {
    const response = await postPreview({ ...VALID_POINTS, delivery: MOSCOW }, cookies).expect(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
  });

  it('should refuse points that are not coordinates', async () => {
    await postPreview({ pickup: MINSK_PICKUP, delivery: { latitude: 'north' } }, cookies).expect(
      HttpStatus.BAD_REQUEST,
    );
    expect(mocks.getRouteGeometry).not.toHaveBeenCalled();
  });
});
