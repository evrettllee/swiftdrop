import { expect, type Page, test } from '@playwright/test';
import { OFFER_TEXTS } from '../src/features/order-offer/config/texts';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { requireCourier, signInAsCourier } from './support/courier';
import { waitForPath } from './support/courier-pages';
import { stubMapbox } from './support/mapbox';
import { buildTestOffer, stubCurrentOffer } from './support/offers';
import {
  COURIER_SEGMENT,
  expectRoadLines,
  routeUnavailableBadge,
  stubRouteLines,
  withoutLines,
} from './support/routing';

// As in courier-offer.spec: the offer and its route come from the stubbed API, one page signed in
// once serves all the tests.
test.describe.configure({ mode: 'serial' });

const OFFER_ID = 990003;

let page: Page;

function offerMap() {
  return page
    .getByRole('dialog', { name: OFFER_TEXTS.TITLE })
    .getByRole('region', { name: MAP_TEXTS.AREA_LABEL });
}

test.beforeAll(async ({ browser }) => {
  requireCourier();
  page = await browser.newPage();
  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
});

// The page is not opened when the courier is not given and the tests are skipped.
test.afterAll(async () => {
  await page?.close();
});

test.beforeEach(async () => {
  await page.unrouteAll();
  await stubMapbox(page);
  await stubCurrentOffer(page, buildTestOffer(OFFER_ID));
});

test('should draw the way of the courier to the pickup point along the roads', async () => {
  await stubRouteLines(page, ROUTING_API_PATHS.OFFER, () => [COURIER_SEGMENT]);
  await page.reload();

  await expectRoadLines(offerMap(), 1);
  await expect(routeUnavailableBadge(offerMap())).toHaveCount(0);
});

test('should show only the points and the badge when the way is unavailable', async () => {
  await stubRouteLines(page, ROUTING_API_PATHS.OFFER, () => withoutLines([COURIER_SEGMENT]));
  await page.reload();

  await expect(routeUnavailableBadge(offerMap())).toBeVisible();
  await expectRoadLines(offerMap(), 0);
});
