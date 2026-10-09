import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { createTestApp } from '../../support/app';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE, SMALL_PACKAGE } from '../../support/fixtures';
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
    it('should return the estimate without authentication when both points are inside a zone', async () => {
      const response = await postEstimate(app, validEstimate).expect(200);

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
      const response = await postEstimate(app, {
        ...validEstimate,
        package: { ...SMALL_PACKAGE, isFragile: true },
      }).expect(200);

      expect(response.body.price).toBe(11.23);
    });

    it('should apply the car multiplier when only a car can carry the package', async () => {
      const response = await postEstimate(app, {
        ...validEstimate,
        package: { ...SMALL_PACKAGE, weightKg: 20 },
      }).expect(200);

      // (7.98 + 20 * 0.50) * 1.3
      expect(response.body.price).toBe(23.37);
    });

    it('should apply the truck multiplier when only a truck can carry the package', async () => {
      const response = await postEstimate(app, {
        ...validEstimate,
        package: { weightKg: 100, lengthCm: 90, widthCm: 50, heightCm: 40, isFragile: false },
      }).expect(200);

      // (7.98 + 100 * 0.50) * 2
      expect(response.body.price).toBe(115.96);
    });
  });
});
