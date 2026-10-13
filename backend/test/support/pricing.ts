import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Database } from '../../src/database/database.module';
import { PRICING_ROUTES } from '../../src/modules/pricing/constants/pricing.constants';
import { resetTestData, seedServiceArea } from './database';
import { MINSK_DELIVERY, MINSK_PICKUP, ROUTE, SMALL_PACKAGE } from './fixtures';
import { postApi } from './http';

const ESTIMATES_PATH = `${PRICING_ROUTES.BASE}/${PRICING_ROUTES.ESTIMATES}`;

export const validEstimate = {
  pickup: MINSK_PICKUP,
  delivery: MINSK_DELIVERY,
  package: SMALL_PACKAGE,
};

export function postEstimate(app: NestExpressApplication, body: Record<string, unknown>) {
  return postApi(app, ESTIMATES_PATH).send(body);
}

// The start of a test that needs prices: clean data, the test service area and a routing service
// that answers with ROUTE.
export async function resetServiceArea(db: Database, getRoute: jest.Mock): Promise<void> {
  await resetTestData(db);
  await seedServiceArea(db);
  getRoute.mockReset();
  getRoute.mockResolvedValue(ROUTE);
}
