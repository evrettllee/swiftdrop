import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { VEHICLE_TYPE_META } from '../src/entities/courier/config/vehicle-types';
import { ORDER_STATUS_LABELS } from '../src/entities/order/config/texts';
import { HISTORY_ORDER_TEXTS } from '../src/pages/courier-history-order/config/texts';
import { LINE_TEXTS, TODAY_TEXTS } from '../src/pages/courier-work/config/texts';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { type CourierMe } from '../src/shared/api/endpoints/courier';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { APP_ROUTES, getOrderPath } from '../src/shared/routes/app-routes';
import { registerClient } from './support/client';
import { TEST_ORDER, placeOrderWithSession } from './support/checkout';
import { getCourierMe, signInAsCourier } from './support/courier';
import { historyCards } from './support/courier-history';
import { waitForPath } from './support/courier-pages';
import {
  codeSection,
  getDeliveredToday,
  PICKUP_POSITION,
  prepareCourier,
  readDeliveryCode,
  releaseCourier,
  requireDeliveryFlow,
} from './support/delivery-flow';
import {
  acceptOffer,
  deliverWithCode,
  pickUpAndDepart,
  press,
  title,
} from './support/delivery-steps';
import { stubMapbox } from './support/mapbox';
import { payOrder } from './support/stripe-webhook';

// The whole slice on the real backend: only Mapbox, Stripe and the position of the device are
// replaced. The client pays through a signed webhook, the courier waits at the pickup point.
test.describe.configure({ mode: 'serial' });

const TEST_TIMEOUT_MS = 120_000;
// The client asks for its order every 10 s.
const POLL_TIMEOUT_MS = 15_000;

let courierContext: BrowserContext | undefined;
let clientContext: BrowserContext | undefined;
let courier: Page;
let client: Page;
let vehicleToRestore: CourierMe['vehicle'] | undefined;

function clientStatus(label: string) {
  return client.getByRole('status').filter({ hasText: label });
}

test.beforeAll(async ({ browser }) => {
  requireDeliveryFlow();
  courierContext = await browser.newContext({
    geolocation: PICKUP_POSITION,
    permissions: ['geolocation'],
  });
  courier = await courierContext.newPage();
  await stubMapbox(courier);
  await signInAsCourier(courier);
  await courier.waitForURL((url) => url.pathname.startsWith('/courier'));
  vehicleToRestore = await prepareCourier(courier.request);
  await courier.goto(APP_ROUTES.COURIER_WORK);
  await waitForPath(courier, APP_ROUTES.COURIER_WORK);

  clientContext = await browser.newContext();
  client = await clientContext.newPage();
  await stubMapbox(client);
  await registerClient(client.request);
});

test.afterAll(async () => {
  if (courierContext !== undefined) {
    await releaseCourier(courier.request, vehicleToRestore);
  }
  await courierContext?.close();
  await clientContext?.close();
});

test('should deliver an order from the payment to the history of the courier', async () => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const deliveredBefore = await getDeliveredToday(courier.request);
  let orderId = 0;

  await test.step('courier goes on the line', async () => {
    await press(courier, LINE_TEXTS.GO_ONLINE);
    await expect(courier.getByRole('heading', { name: LINE_TEXTS.ONLINE_TITLE })).toBeVisible();
    expect((await getCourierMe(courier.request)).isAvailable).toBe(true);
  });

  await test.step('client places the order and pays it by the webhook', async () => {
    await client.goto(APP_ROUTES.ORDER_NEW);
    const placed = await placeOrderWithSession(client, TEST_ORDER);
    orderId = placed.orderId;
    await payOrder(client.request, placed.orderId, placed.sessionId);
    await client.goto(getOrderPath(orderId));
    await expect(client.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toBeVisible();
  });

  await test.step('courier sees the offer and accepts it', () => acceptOffer(courier));

  await test.step('client sees the courier without a reload', async () => {
    const vehicle = (await getCourierMe(courier.request)).vehicle;
    const heading = client.getByRole('heading', { name: ORDER_COURIER_TEXTS.SECTION, exact: true });
    await expect(heading).toBeVisible({ timeout: POLL_TIMEOUT_MS });
    await expect(
      client.getByText(VEHICLE_TYPE_META[vehicle?.type ?? 'car'].label).first(),
    ).toBeVisible();
    await expect(client.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toHaveCount(0);
  });

  await test.step('courier picks the parcel up and departs', () => pickUpAndDepart(courier));

  let code = '';

  await test.step('client sees the code and no cancel button', async () => {
    await expect(codeSection(client)).toBeVisible({ timeout: POLL_TIMEOUT_MS });
    code = await readDeliveryCode(client);
    expect(/^\d{4}$/.test(code), 'The code has four digits').toBe(true);
    await expect(client.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  });

  await test.step('courier enters a wrong code and then the right one', async () => {
    await deliverWithCode(courier, code);
    const delivered = courier.locator('dt', { hasText: TODAY_TEXTS.DELIVERED }).locator('+ dd');
    await expect(delivered).toHaveText(String(deliveredBefore + 1));
  });

  await test.step('client sees the order delivered and no code', async () => {
    await expect(clientStatus(ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED]).first()).toBeVisible({
      timeout: POLL_TIMEOUT_MS,
    });
    await expect(codeSection(client)).toHaveCount(0);
  });

  await test.step('courier finds the order first in the history', async () => {
    const menu = courier.getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL });
    await menu.getByRole('link', { name: COURIER_LAYOUT_TEXTS.NAV_HISTORY }).click();
    const first = historyCards(courier).first();
    await expect(first).toContainText(`№${orderId}`);
    await expect(first).toContainText(ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED]);
    await first.getByRole('link').click();
    await expect(title(courier, HISTORY_ORDER_TEXTS.title(`№${orderId}`))).toBeVisible();
  });
});
