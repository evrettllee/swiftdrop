import { expect, type Page, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { ORDER_STATUS_LABELS } from '../src/entities/order/config/texts';
import { COURIER_PROGRESS_STEPS } from '../src/pages/courier-history-order/config/progress';
import { HISTORY_ORDER_TEXTS } from '../src/pages/courier-history-order/config/texts';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { HTTP_STATUS } from '../src/shared/api/request-config';
import { PAGINATION_TEXTS } from '../src/shared/config/texts';
import {
  APP_ROUTES,
  getCourierHistoryOrderPath,
  getCourierHistoryPath,
} from '../src/shared/routes/app-routes';
import { requireCourier, signInAsCourier } from './support/courier';
import {
  DESKTOP_VIEWPORT,
  HISTORY_PAGE_SIZE as PAGE_SIZE,
  HISTORY_TOTAL as TOTAL,
  NEWEST_ORDER_ID,
  PHONE_VIEWPORT,
  stubHistory,
} from './support/courier-history';
import { answerAs, type OrderAnswer, stubHistoryOrder } from './support/courier-history-order';
import { waitForPath } from './support/courier-pages';
import { stubMapbox } from './support/mapbox';
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';

// The history and the order come from the stubbed API: the seeded courier keeps the orders it has.
// One page signed in once serves all the tests.
test.describe.configure({ mode: 'serial' });

const DELIVERED = answerAs(ORDER_STATUS.DELIVERED);

let page: Page;
// What the stub of the order answers now: a test changes it, the stub keeps to the address.
let answerOrder: OrderAnswer = DELIVERED;

function section(name: string) {
  return page.getByRole('region', { name, exact: true });
}

function title(orderId: number) {
  return page.getByRole('heading', { level: 1, name: HISTORY_ORDER_TEXTS.title(`№${orderId}`) });
}

function backLink() {
  return page.getByRole('link', { name: HISTORY_ORDER_TEXTS.BACK });
}

function openOrder(orderId = NEWEST_ORDER_ID, listSearch = ''): Promise<unknown> {
  return page.goto(getCourierHistoryOrderPath(orderId, listSearch));
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
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.courierHistoryOrder(NEWEST_ORDER_ID), () => [
    PARCEL_SEGMENT,
  ]);
  await stubHistory(page);
  answerOrder = DELIVERED;
  await stubHistoryOrder(page, () => answerOrder);
});

test('should open the order from its card with the route, the stages and the parcel', async () => {
  await page.goto(APP_ROUTES.COURIER_HISTORY);

  await page.getByRole('link', { name: new RegExp(`№${NEWEST_ORDER_ID}`) }).click();

  await expect(title(NEWEST_ORDER_ID)).toBeVisible();
  await expect(page.getByText(ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED]).first()).toBeVisible();
  await expect(page.getByText(/Завершён 12 октября 2026/)).toBeVisible();
  const route = section(HISTORY_ORDER_TEXTS.SECTION_ROUTE);
  await expect(route).toContainText('улица Свердлова, 13а, Минск');
  await expect(route).toContainText('проспект Притыцкого, 83, кв. 47, Минск');
  const steps = section(HISTORY_ORDER_TEXTS.SECTION_PROGRESS).getByRole('listitem');
  await expect(steps).toHaveText(
    COURIER_PROGRESS_STEPS.map((step) => new RegExp(`^${step.label}\\d{2}:\\d{2}$`)),
  );
  await expect(steps.and(page.locator('[aria-current]'))).toHaveCount(1);
  await expect(steps.last()).toHaveAttribute('aria-current', 'step');
  const parcel = section(HISTORY_ORDER_TEXTS.SECTION_PARCEL);
  await expect(parcel).toContainText('2,5 кг');
  await expect(parcel).toContainText('40 × 30 × 20 см');
  await expect(parcel).toContainText('7,98 км');
  // The people of the order stay out of the page: nobody to call.
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  expect(await page.locator('main').innerText()).not.toMatch(/\+?375/);
});

test('should end the stages of a cancelled order with the cancellation', async () => {
  answerOrder = answerAs(ORDER_STATUS.CANCELLED);
  await openOrder();

  const steps = section(HISTORY_ORDER_TEXTS.SECTION_PROGRESS).getByRole('listitem');

  await expect(steps).toHaveCount(3);
  await expect(steps.last()).toHaveText(new RegExp(ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED]));
  await expect(steps.and(page.locator('[aria-current]'))).toHaveCount(1);
  await expect(steps.last()).toHaveAttribute('aria-current', 'step');
});

test('should lead back to the same page of the history', async () => {
  await page.goto(getCourierHistoryPath('page=2'));
  await expect(page.getByText(PAGINATION_TEXTS.range(6, 10, TOTAL))).toBeVisible();

  await page.getByRole('link', { name: new RegExp(`№${NEWEST_ORDER_ID - PAGE_SIZE}`) }).click();
  await expect(page).toHaveURL(getCourierHistoryOrderPath(NEWEST_ORDER_ID - PAGE_SIZE, 'page=2'));
  await backLink().click();

  await expect(page).toHaveURL(getCourierHistoryPath('page=2'));
  await expect(page.getByText(PAGINATION_TEXTS.range(6, 10, TOTAL))).toBeVisible();
});

test('should keep the history item of the menu active on the order', async () => {
  const link = page
    .getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL })
    .getByRole('link', { name: COURIER_LAYOUT_TEXTS.NAV_HISTORY });
  await page.goto(APP_ROUTES.COURIER_HISTORY);
  await expect(link).toHaveAttribute('aria-current', 'page');
  const activeClass = (await link.getAttribute('class')) ?? '';

  await openOrder();
  await expect(title(NEWEST_ORDER_ID)).toBeVisible();

  await expect(link).toHaveAttribute('class', activeClass);
});

test('should say the order is not found when it is not a finished one of the courier', async () => {
  answerOrder = () => ({ status: HTTP_STATUS.NOT_FOUND, json: { message: 'Заказ не найден' } });
  await openOrder(NEWEST_ORDER_ID, 'page=2');

  await expect(
    page.getByRole('heading', { name: HISTORY_ORDER_TEXTS.NOT_FOUND_TITLE }),
  ).toBeVisible();
  await expect(backLink()).toHaveAttribute('href', getCourierHistoryPath('page=2'));
});

test('should say the order is not found when the address is not an order number', async () => {
  await page.goto(`${APP_ROUTES.COURIER_HISTORY}/abc`);

  await expect(
    page.getByRole('heading', { name: HISTORY_ORDER_TEXTS.NOT_FOUND_TITLE }),
  ).toBeVisible();
});

test('should tell the failure and load the order again on retry', async () => {
  answerOrder = () => ({
    status: HTTP_STATUS.SERVICE_UNAVAILABLE,
    json: { message: 'Unavailable' },
  });
  await openOrder();

  await expect(
    page.getByRole('alert').filter({ hasText: HISTORY_ORDER_TEXTS.LOAD_ERROR }),
  ).toBeVisible();

  answerOrder = DELIVERED;
  await page.getByRole('button', { name: HISTORY_ORDER_TEXTS.RETRY }).click();

  await expect(title(NEWEST_ORDER_ID)).toBeVisible();
});

test('should stack the sections on a phone with the way back above the title', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await openOrder();

  await expect(title(NEWEST_ORDER_ID)).toBeVisible();
  await expect(section(HISTORY_ORDER_TEXTS.SECTION_PARCEL)).toContainText('7,98 км');
  const back = await backLink().boundingBox();
  const heading = await title(NEWEST_ORDER_ID).boundingBox();
  expect(back?.y).toBeLessThan(heading?.y ?? 0);
});
