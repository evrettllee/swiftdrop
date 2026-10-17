import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../../src/pages/order/config/tracking';
import {
  COURIERS_API_PATHS,
  type CourierMe,
  courierTodayStatsSchema,
  VEHICLE_TYPE,
} from '../../src/shared/api/endpoints/courier';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/shared/api/request-config';
import { TEST_ADDRESSES } from './mapbox';
import { getCourierMe, requireCourier, restoreVehicle, setCourierAvailability } from './courier';
import { TEST_CAR } from './courier-pages';
import { hasWebhookSecret } from './stripe-webhook';

const DIGITS_ONLY = /\D/g;

// The courier waits at the pickup point of the order, so the backend picks them as the nearest one.
export const PICKUP_POSITION = {
  latitude: TEST_ADDRESSES.SVERDLOVA.latitude,
  longitude: TEST_ADDRESSES.SVERDLOVA.longitude,
};

// A bicycle takes no fragile parcel, which the test order is; the other vehicles carry it.
const VEHICLE_WITHOUT_FRAGILE = VEHICLE_TYPE.BICYCLE;

// Skips the test unless the seeded courier and the signing secret of the webhook are given.
export function requireDeliveryFlow(): void {
  requireCourier();
  test.skip(!hasWebhookSecret(), 'Set E2E_STRIPE_WEBHOOK_SECRET to the secret of the webhook');
}

async function putVehicle(request: APIRequestContext): Promise<void> {
  const response = await request.put(`${API_BASE_PATH}${COURIERS_API_PATHS.VEHICLE}`, {
    headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
    data: {
      type: VEHICLE_TYPE.CAR,
      brand: TEST_CAR.brand,
      model: TEST_CAR.model,
      licensePlate: TEST_CAR.plate,
    },
  });

  expect(response.ok(), 'The test car was saved').toBe(true);
}

// Brings the courier to a known start: off the line, free of orders and with a vehicle that
// carries the parcel. Nothing is cancelled: a courier who is busy stops the test. Returns the
// vehicle to put back, or undefined when it was left as it was.
export async function prepareCourier(
  request: APIRequestContext,
): Promise<CourierMe['vehicle'] | undefined> {
  await setCourierAvailability(request, false);
  const me = await getCourierMe(request);

  expect(me.activeOrderId, 'The courier has no order in progress').toBeNull();

  if (me.vehicle !== null && me.vehicle.type !== VEHICLE_WITHOUT_FRAGILE) {
    return undefined;
  }

  await putVehicle(request);

  return me.vehicle;
}

// Puts the courier off the line and the vehicle back; safe to call when the preparation failed.
export async function releaseCourier(
  request: APIRequestContext,
  vehicle: CourierMe['vehicle'] | undefined,
): Promise<void> {
  await setCourierAvailability(request, false);

  if (vehicle !== undefined) {
    await restoreVehicle(request, vehicle);
  }
}

// The number of orders the courier has delivered today.
export async function getDeliveredToday(request: APIRequestContext): Promise<number> {
  const response = await request.get(`${API_BASE_PATH}${COURIERS_API_PATHS.STATS_TODAY}`);

  expect(response.ok(), 'The results of the day were loaded').toBe(true);

  return courierTodayStatsSchema.parse(await response.json()).delivered;
}

// The digits of the code the client shows for the courier, read from the label of the group.
// They are only returned: nothing here or in the test prints them.
export async function readDeliveryCode(page: Page): Promise<string> {
  const label = await page.locator('[role="group"][aria-label^="Код "]').getAttribute('aria-label');

  return (label ?? '').replace(DIGITS_ONLY, '');
}

// A code that is not the right one: the first digit moves on.
export function otherCode(code: string): string {
  return `${(Number(code[0]) + 1) % 10}${code.slice(1)}`;
}

export function codeSection(page: Page) {
  return page.getByRole('heading', { name: ORDER_COURIER_TEXTS.CODE_SECTION, exact: true });
}
