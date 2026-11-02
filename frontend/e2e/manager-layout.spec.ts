import { expect, test } from '@playwright/test';
import { FORBIDDEN_TEXTS } from '../src/pages/forbidden/config/texts';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE, type Role } from '../src/shared/session/auth-user';
import { managerMenu, openAsManager, pushOrderChange } from './support/manager';
import { stubSession } from './support/stub-session';

const BURST_SIZE = 5;
const EVENT_WAIT_MS = 1_000;

test('should send a manager to the orders after signing in', async ({ page }) => {
  await openAsManager(page);

  await page.goto(APP_ROUTES.AUTH);

  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByRole('heading', { level: 1, name: 'Заказы' })).toBeVisible();
});

for (const role of [ROLE.CLIENT, ROLE.COURIER] satisfies Role[]) {
  test(`should show the 403 page to a ${role} on the pages of the manager`, async ({ page }) => {
    await stubSession(page, role);

    for (const path of [APP_ROUTES.MANAGER_ORDERS, '/manager/zones/new', '/manager/orders/48231']) {
      await page.goto(path);

      await expect(
        page.getByRole('heading', { name: FORBIDDEN_TEXTS.FORBIDDEN_TITLE }),
      ).toBeVisible();
    }
  });
}

test('should show the counts of the badges and the role in the sidebar', async ({ page }) => {
  await openAsManager(page);

  await page.goto(APP_ROUTES.MANAGER_MAP);

  const orders = managerMenu(page).getByRole('link', { name: /^Заказы/ });
  const support = managerMenu(page).getByRole('link', { name: /^Поддержка/ });
  await expect(orders).toHaveAccessibleName('Заказы, 3 требуют внимания');
  await expect(orders).toContainText('3');
  await expect(support).toHaveAccessibleName('Поддержка, 2 без ответа');
  await expect(support).toContainText('2');
  await expect(page.getByText('Менеджер', { exact: true })).toBeVisible();
});

test('should load a count once for a batch of socket events', async ({ page }) => {
  const { counts, socket } = await openAsManager(page);
  await page.goto(APP_ROUTES.MANAGER_MAP);
  const orders = managerMenu(page).getByRole('link', { name: /^Заказы/ });
  await expect(orders).toHaveAccessibleName('Заказы, 3 требуют внимания');
  const ordersAsked = counts.orderRequests;
  const supportAsked = counts.supportRequests;

  counts.attention = 4;
  for (let index = 0; index < BURST_SIZE; index += 1) {
    pushOrderChange(socket, 48231 + index);
  }

  await expect(orders).toHaveAccessibleName('Заказы, 4 требуют внимания');
  expect(counts.orderRequests - ordersAsked).toBe(1);
  expect(counts.supportRequests).toBe(supportAsked);

  counts.awaiting = 0;
  socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: 17,
    kind: 'closed',
    awaitingStaff: false,
    status: 'closed',
  });

  await expect(
    managerMenu(page).getByRole('link', { name: 'Поддержка', exact: true }),
  ).toBeVisible();
  expect(counts.orderRequests - ordersAsked).toBe(1);
});

test('should not load a count again for a broken event', async ({ page }) => {
  const { counts, socket } = await openAsManager(page);
  await page.goto(APP_ROUTES.MANAGER_MAP);
  await expect(managerMenu(page).getByRole('link', { name: /^Заказы/ })).toHaveAccessibleName(
    'Заказы, 3 требуют внимания',
  );
  const asked = counts.orderRequests;

  socket.push(SOCKET_EVENTS.STAFF_ORDER, { orderId: 48231, kind: 'lost' });
  await page.waitForTimeout(EVENT_WAIT_MS);

  expect(counts.orderRequests).toBe(asked);
});
