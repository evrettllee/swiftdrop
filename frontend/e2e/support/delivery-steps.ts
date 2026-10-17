import { expect, type Page } from '@playwright/test';
import { OFFER_TEXTS } from '../../src/features/order-offer/config/texts';
import {
  DELIVERY_CODE_TEXTS,
  ORDER_DELIVERED_TEXTS,
  ORDER_STEP_TEXTS,
} from '../../src/pages/courier-work/config/texts';
import { UI_TEXTS } from '../../src/shared/config/texts';
import { MAP_CLASS, MAP_TEXTS } from '../../src/shared/ui/route-map/map';
import { otherCode } from './delivery-flow';

// The dispatcher looks for orders every 5 s, so the offer may take a little more than that.
const OFFER_TIMEOUT_MS = 20_000;
const WRONG_CODE_MESSAGE = 'Неверный код. Осталось попыток: 4';

export function title(page: Page, name: string) {
  return page.getByRole('heading', { level: 1, name, exact: true });
}

export function press(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true }).click();
}

// Waits for the window of the offer, checks the route on its map and accepts the order.
export async function acceptOffer(courier: Page): Promise<void> {
  const offer = courier.getByRole('dialog', { name: OFFER_TEXTS.TITLE });

  await expect(offer).toBeVisible({ timeout: OFFER_TIMEOUT_MS });
  const map = offer.getByRole('region', { name: MAP_TEXTS.AREA_LABEL });
  // The courier stands at the pickup point, so the way to it is empty: the point and the
  // dashed area of the delivery are what the map draws.
  await expect(map.locator(`.${MAP_CLASS.DOT_PICKUP}`)).toBeVisible();
  await expect(map.locator('.leaflet-overlay-pane path').first()).toBeAttached();
  await offer.getByRole('button', { name: OFFER_TEXTS.ACCEPT }).click();
  await expect(title(courier, ORDER_STEP_TEXTS.TO_PICKUP)).toBeVisible();
}

// The courier takes the parcel and sets off to the recipient.
export async function pickUpAndDepart(courier: Page): Promise<void> {
  await press(courier, ORDER_STEP_TEXTS.PICK_UP);
  await expect(title(courier, ORDER_STEP_TEXTS.PICKED_UP)).toBeVisible();
  await press(courier, ORDER_STEP_TEXTS.DEPART);
  await expect(title(courier, ORDER_STEP_TEXTS.TO_RECIPIENT)).toBeVisible();
}

// A wrong code first, then the right one, and back to the work page.
export async function deliverWithCode(courier: Page, code: string): Promise<void> {
  await press(courier, ORDER_STEP_TEXTS.ENTER_CODE);
  const field = courier.getByLabel(DELIVERY_CODE_TEXTS.LABEL, { exact: true });

  await field.fill(otherCode(code));
  await press(courier, DELIVERY_CODE_TEXTS.SUBMIT);
  await expect(courier.getByRole('alert').filter({ hasText: WRONG_CODE_MESSAGE })).toBeVisible();
  await field.fill(code);
  await press(courier, DELIVERY_CODE_TEXTS.SUBMIT);
  await expect(title(courier, ORDER_DELIVERED_TEXTS.TITLE)).toBeVisible();
  await press(courier, ORDER_DELIVERED_TEXTS.BACK_TO_WORK);
  await expect(title(courier, UI_TEXTS.COURIER_WORK)).toBeVisible();
}
