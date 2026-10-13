import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { serviceZones, tariffs } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  PRICING_ERROR_MESSAGES,
  PRICING_THROTTLE_LIMIT,
} from '../../../src/modules/pricing/constants/pricing.constants';
import { createTestApp } from '../../support/app';
import { CLIENT_IP_HEADER } from '../../support/constants';
import { resetTestData, seedServiceArea } from '../../support/database';
import { MINSK_DELIVERY, MINSK_PICKUP, MOSCOW, ROUTE, SMALL_PACKAGE } from '../../support/fixtures';
import { nextClientIp } from '../../support/http';
import { postEstimate, validEstimate } from '../../support/pricing';

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

  describe('estimates', () => {
    it('should return 422 with the pickup message and skip routing when the pickup is outside every zone', async () => {
      const response = await postEstimate(app, { ...validEstimate, pickup: MOSCOW }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
      expect(getRoute).not.toHaveBeenCalled();
    });

    it('should return 422 with the delivery message when the delivery is outside every zone', async () => {
      const response = await postEstimate(app, { ...validEstimate, delivery: MOSCOW }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.DELIVERY_OUT_OF_ZONE);
    });

    it('should return 422 and skip routing when no transport can carry the package', async () => {
      const response = await postEstimate(app, {
        ...validEstimate,
        package: { ...SMALL_PACKAGE, weightKg: 600 },
      }).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.NO_VEHICLE);
      expect(getRoute).not.toHaveBeenCalled();
    });

    it('should treat a switched off zone as outside the service area', async () => {
      await db.update(serviceZones).set({ isActive: false });

      const response = await postEstimate(app, validEstimate).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    });

    it('should treat a zone with a switched off tariff as outside the service area', async () => {
      await db.update(tariffs).set({ isActive: false });

      const response = await postEstimate(app, validEstimate).expect(422);

      expect(response.body.message).toBe(PRICING_ERROR_MESSAGES.PICKUP_OUT_OF_ZONE);
    });

    it('should return 400 with a field error when the latitude is out of range', async () => {
      const response = await postEstimate(app, {
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
      await postEstimate(app, { pickup: MINSK_PICKUP, delivery: MINSK_DELIVERY }).expect(400);
    });

    it('should return 429 when estimates from one address exceed the limit', async () => {
      const ip = nextClientIp();
      const statuses: number[] = [];

      for (let attempt = 0; attempt <= PRICING_THROTTLE_LIMIT; attempt += 1) {
        const response = await postEstimate(app, validEstimate).set(CLIENT_IP_HEADER, ip);
        statuses.push(response.status);
      }

      expect(statuses).toEqual([...Array.from({ length: PRICING_THROTTLE_LIMIT }, () => 200), 429]);
    });
  });
});
