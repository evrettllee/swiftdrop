import { expect, test } from '@playwright/test';
import { FORBIDDEN_TEXTS } from '../src/pages/forbidden/config/texts';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { openAsAdmin } from './support/admin';
import { managerMenu, openAsManager } from './support/manager';

const MANAGER_URLS = [
  APP_ROUTES.MANAGER_ORDERS,
  '/manager/orders/48231',
  APP_ROUTES.MANAGER_MAP,
  APP_ROUTES.MANAGER_SUPPORT,
  APP_ROUTES.MANAGER_ZONES,
  APP_ROUTES.MANAGER_ANALYTICS,
  APP_ROUTES.MANAGER_PROFILE,
];

const EVENT_WAIT_MS = 1_000;

test('should show the 403 page to an admin on the pages of the manager', async ({ page }) => {
  await openAsAdmin(page);

  for (const path of MANAGER_URLS) {
    await page.goto(path);

    await expect(
      page.getByRole('heading', { name: FORBIDDEN_TEXTS.FORBIDDEN_TITLE }),
    ).toBeVisible();
  }
});

test('should not load the counts of the staff nor react to its events for an admin', async ({
  page,
}) => {
  const { requests, socket } = await openAsAdmin(page);
  await page.goto(APP_ROUTES.ADMIN_USERS);
  await expect(page.getByRole('heading', { level: 1, name: 'Пользователи' })).toBeVisible();

  socket.push(SOCKET_EVENTS.STAFF_ORDER, {
    orderId: 48231,
    kind: 'status',
    status: 'awaiting_manual_assignment',
    statusChangedAt: '2026-10-26T12:00:00.000Z',
    courierId: null,
  });
  socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: 17,
    kind: 'closed',
    awaitingStaff: false,
    status: 'closed',
  });
  await page.waitForTimeout(EVENT_WAIT_MS);

  expect(requests).toEqual({ orderCounts: 0, supportCounts: 0 });
  expect(socket.joins).toEqual([]);
  expect(socket.ticketJoins).toEqual([]);
});

test('should keep the menu of the manager as it was', async ({ page }) => {
  const { counts } = await openAsManager(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  await expect(managerMenu(page).getByRole('link')).toHaveText([
    /^Заказы/,
    'Карта курьеров',
    /^Поддержка/,
    'Зоны',
    'Аналитика',
  ]);
  await expect(page.getByText('Менеджер', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Администратор/ })).toHaveCount(0);
  expect(counts.orderRequests).toBeGreaterThan(0);
});
