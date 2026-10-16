import type { Locator, Page } from '@playwright/test';
import { LANDING_TEXTS } from '../../src/pages/landing/config/texts';
import { ROUTE_POINT, ROUTE_POINT_LABELS } from '../../src/shared/config/route-point';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';
import { MAP_TEXTS } from '../../src/shared/ui/route-map/map';
import { checkoutAddressField, chooseAddress } from './checkout';
import { TEST_ADDRESSES } from './mapbox';

const TEST_ROUTE = [
  [ROUTE_POINT.PICKUP, TEST_ADDRESSES.SVERDLOVA],
  [ROUTE_POINT.DELIVERY, TEST_ADDRESSES.PRITYTSKOGO],
] as const;

// Sets both points of the calculator on the landing; returns its map.
export async function chooseCalculatorRoute(page: Page): Promise<Locator> {
  await page.goto(APP_ROUTES.HOME);
  const calculator = page.getByRole('region', { name: LANDING_TEXTS.CALC_TITLE });

  for (const [kind, address] of TEST_ROUTE) {
    const field = calculator.getByRole('combobox', { name: ROUTE_POINT_LABELS[kind], exact: true });
    await chooseAddress(field, calculator, address);
  }

  return calculator.getByRole('region', { name: MAP_TEXTS.REGION_LABEL });
}

// Sets both points of the order form; returns its map.
export async function chooseCheckoutRoute(page: Page): Promise<Locator> {
  await page.goto(APP_ROUTES.ORDER_NEW);

  for (const [kind, address] of TEST_ROUTE) {
    const block = page.getByRole('group', { name: ROUTE_POINT_LABELS[kind], exact: true });
    await chooseAddress(checkoutAddressField(page, kind), block, address);
  }

  return page.getByRole('region', { name: MAP_TEXTS.REGION_LABEL });
}
