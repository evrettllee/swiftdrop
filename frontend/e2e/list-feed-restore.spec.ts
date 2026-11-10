import { expect, type Locator, type Page, test } from '@playwright/test';
import { AUTH_TEXTS } from '../src/pages/auth/config/texts';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { historyCards, PHONE_VIEWPORT } from './support/courier-history';
import { answerAs, stubHistoryOrder } from './support/courier-history-order';
import { openCourierHistory } from './support/courier-history-page';
import { listRequests, stubMyOrders } from './support/my-orders';
import { myOrders, olderOrders } from './support/my-orders-fixtures';
import { stubOrderDetails } from './support/order-details';

test.use({ viewport: PHONE_VIEWPORT });

const OPENED_ORDER_ID = 47888;
const SCROLL_TOLERANCE_PX = 4;

async function answerTheRestWithNotFound(page: Page): Promise<void> {
  await page.route(new RegExp(`^https?://[^/]+${API_BASE_PATH}/`), (route) =>
    route.fulfill({ status: 404, json: { message: 'Не найдено' } }),
  );
}

async function openFromFeed(page: Page, card: Locator): Promise<number> {
  await card.scrollIntoViewIfNeeded();
  const scrollY = await page.evaluate(() => window.scrollY);
  await card.click();

  return scrollY;
}

async function expectScroll(page: Page, scrollY: number): Promise<void> {
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - scrollY))
    .toBeLessThanOrEqual(SCROLL_TOLERANCE_PX);
}

test('should bring back the shown orders and the scroll without a new request', async ({
  page,
}) => {
  await answerTheRestWithNotFound(page);
  const stub = await stubMyOrders(page, [...myOrders(), ...olderOrders(17)]);
  await stubOrderDetails(page, OPENED_ORDER_ID, ORDER_STATUS.DELIVERED);
  await page.goto(APP_ROUTES.ORDERS);
  const cards = page.getByRole('tabpanel').getByRole('link', { name: /^№/ });
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(cards).toHaveCount(25);
  const asked = listRequests(stub).length;

  const scrollY = await openFromFeed(page, cards.filter({ hasText: String(OPENED_ORDER_ID) }));
  await expect(page).toHaveURL(new RegExp(`/orders/${OPENED_ORDER_ID}$`));
  await page.goBack();

  await expect(cards).toHaveCount(25);
  await expectScroll(page, scrollY);
  expect(listRequests(stub)).toHaveLength(asked);
  await expect(page.getByRole('button', { name: 'Показать ещё' })).toHaveCount(0);
});

test('should bring back the shown deliveries of the courier and load anew after a change', async ({
  page,
}) => {
  await answerTheRestWithNotFound(page);
  const stub = await openCourierHistory(page);
  await stubHistoryOrder(page, () => answerAs(ORDER_STATUS.DELIVERED));
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(historyCards(page)).toHaveCount(23);
  const asked = stub.requests.length;

  const scrollY = await openFromFeed(page, historyCards(page).nth(21));
  await expect(page).not.toHaveURL(APP_ROUTES.COURIER_HISTORY);
  await page.goBack();

  await expect(historyCards(page)).toHaveCount(23);
  await expectScroll(page, scrollY);
  expect(stub.requests).toHaveLength(asked);

  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('finishedAt:asc');
  await expect(historyCards(page)).toHaveCount(20);
});

test('should not bring back the feed of the previous user after another one signs in', async ({
  page,
}) => {
  await answerTheRestWithNotFound(page);
  const stub = await stubMyOrders(page, [...myOrders(), ...olderOrders(17)]);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.LOGOUT}`, (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, (route) =>
    route.fulfill({
      json: {
        user: {
          userId: 990008,
          firstName: 'Олег',
          lastName: 'Ким',
          email: 'other@example.com',
          phone: null,
          role: ROLE.CLIENT,
        },
      },
    }),
  );
  await page.goto(APP_ROUTES.ORDERS);
  const cards = page.getByRole('tabpanel').getByRole('link', { name: /^№/ });
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(cards).toHaveCount(25);

  await page.getByRole('link', { name: 'Профиль' }).click();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(new RegExp(`${APP_ROUTES.AUTH}`));
  stub.orders = myOrders().slice(0, 3);
  await page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true }).fill('other@example.com');
  await page.getByLabel(AUTH_TEXTS.LABEL_PASSWORD, { exact: true }).fill('Password123');
  await page.getByRole('button', { name: AUTH_TEXTS.SUBMIT_LOGIN, exact: true }).click();
  await page.getByRole('link', { name: 'Заказы' }).first().click();

  await expect(page).toHaveURL(APP_ROUTES.ORDERS);
  await expect(cards).toHaveCount(3);
});
