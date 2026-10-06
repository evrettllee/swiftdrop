import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { serviceZones, tariffs } from '../../src/db/schema';
import { OsrmService } from '../../src/integrations/osrm/osrm.service';
import {
  PRICING_ERROR_MESSAGES,
  PRICING_ROUTES,
  PRICING_THROTTLE_LIMIT,
} from '../../src/pricing/pricing.constants';
import { createTestApp } from '../support/app';
import { CLIENT_IP_HEADER } from '../support/constants';
import { resetTestData, seedServiceArea } from '../support/database';
import { MINSK_DELIVERY, MINSK_PICKUP, MOSCOW, ROUTE, SMALL_PACKAGE } from '../support/fixtures';
import { nextClientIp, postApi } from '../support/http';

const ESTIMATES_PATH = `${PRICING_ROUTES.BASE}/${PRICING_ROUTES.ESTIMATES}`;

const validEstimate = {
  pickup: MINSK_PICKUP,
  delivery: MINSK_DELIVERY,
  package: SMALL_PACKAGE,
};

describe('Pricing (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
  });

  afterAll(async () => {
    await app.close();
  });

  function postEstimate(body: Record<string, unknown>) {
    return postApi(app, ESTIMATES_PATH).send(body);
  }

  describe('estimates', () => {
    it('should return the estimate without authentication when both points are inside a zone', async () => {
      const response = await postEstimate(validEstimate).expect(200);

      // (7.98 km * 1.00 + 2.5 kg * 0.50) * 1.0 for a package that fits a courier on foot.
      expect(response.body).toEqual({
        price: 9.23,
        currency: 'BYN',
        distanceKm: 7.98,
        estimatedMinutes: 22,
        coefficient: 1,
      });
    });

    it('should add the fragile fee when the package is fragile', async () => {
      const response = await postEstimate({
        ...validEstimate,
        package: { ...SMALL_PACKAGE, isFragile: true },
      }).expect(200);

      expect(response.body.price).toBe(11.23);
    });

    it('should apply the car multiplier when only a car can carry the package', async () => {
      const response = await postEstimate({
        ...validEstimate,
        package: { ...SMALL_PACKAGE, weightKg: 20 },
      }).expect(200);

      // (7.98 + 20 * 0.50) * 1.3
      expect(response.body.price).toBe(23.37);
    });

    it('should apply the truck multiplier when only a truck can carry the package', async () => {
      const response = await postEstimate({
        ...validEstimate,
        package: { weightKg: 100, lengthCm: 90, widthCm: 50, heightCm: 40, isFragile: false },
      }).expect(200);

      // (7.98 + 100 * 0.50) * 2
      expect(response.body.price).toBe(115.96);
    });

    it('should return 422 with the pickup message and skip routing when the pickup is outside every zone', async () => {
      const response = await postEstimate({ ...validEstimate, pickup: MOSCOW }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
      expect(getRoute).not.toHaveBeenCalled();
    });

    it('should return 422 with the delivery message when the delivery is outside every zone', async () => {
      const response = await postEstimate({ ...validEstimate, delivery: MOSCOW }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
    });

    it('should return 422 and skip routing when no transport can carry the package', async () => {
      const response = await postEstimate({
        ...validEstimate,
        package: { ...SMALL_PACKAGE, weightKg: 600 },
      }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.NO_VEHICLE);
      expect(getRoute).not.toHaveBeenCalled();
    });

    it('should treat a switched off zone as outside the service area', async () => {
      await db.update(serviceZones).set({ isActive: false });

      const response = await postEstimate(validEstimate).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    });

    it('should treat a zone with a switched off tariff as outside the service area', async () => {
      await db.update(tariffs).set({ isActive: false });

      const response = await postEstimate(validEstimate).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    });

    it('should return 400 with a field error when the latitude is out of range', async () => {
      const response = await postEstimate({
        ...validEstimate,
        pickup: { ...MINSK_PICKUP, latitude: 91 },
      }).expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: expect.stringContaining('latitude') }),
        ]),
      );
    });

    it('should return 400 when the package is missing', async () => {
      await postEstimate({ pickup: MINSK_PICKUP, delivery: MINSK_DELIVERY }).expect(400);
    });

    it('should return 429 when estimates from one address exceed the limit', async () => {
      const ip = nextClientIp();
      const statuses: number[] = [];

      for (let attempt = 0; attempt <= PRICING_THROTTLE_LIMIT; attempt += 1) {
        const response = await postEstimate(validEstimate).set(CLIENT_IP_HEADER, ip);
        statuses.push(response.status);
      }

      expect(statuses).toEqual([...Array.from({ length: PRICING_THROTTLE_LIMIT }, () => 200), 429]);
    });
  });
});
