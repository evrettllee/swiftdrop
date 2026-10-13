import type { NestExpressApplication } from '@nestjs/platform-express';
import { PRICING_ROUTES } from '../../src/modules/pricing/constants/pricing.constants';
import { MINSK_DELIVERY, MINSK_PICKUP, SMALL_PACKAGE } from './fixtures';
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
