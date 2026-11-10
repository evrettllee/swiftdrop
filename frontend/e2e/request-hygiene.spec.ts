import { expect, type Page, test } from '@playwright/test';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { openCourierHistory } from './support/courier-history-page';
import { MAP_PATH, stubCouriersMap } from './support/manager-map';
import { stubManagerOrders } from './support/manager-orders';
import { stubSupport, SUPPORT_PATH } from './support/manager-support';
import { stubMyOrders } from './support/my-orders';

const SETTLE_MS = 1_500;
const CHAT_RESYNC_AFTER_ROOM_JOIN = /\/messages\?/;
const MENU_BADGE_COUNTS = /^GET \/api\/manager\/orders\/counts$/;
const KNOWN_REPEATS = [CHAT_RESYNC_AFTER_ROOM_JOIN, MENU_BADGE_COUNTS];
const SLOW_ANSWER_MS = 1_500;

test.use({ viewport: { width: 1440, height: 1000 } });

function collectFinished(page: Page): string[] {
  const finished: string[] = [];
  page.on('requestfinished', (request) => {
    const url = new URL(request.url());

    if (url.pathname.startsWith(API_BASE_PATH) && !url.pathname.includes('socket.io')) {
      finished.push(`${request.method()} ${url.pathname}${url.search}`);
    }
  });

  return finished;
}

function repeated(requests: readonly string[]): string[] {
  return requests.filter(
    (request, index) =>
      requests.indexOf(request) !== index && !KNOWN_REPEATS.some((known) => known.test(request)),
  );
}

const PAGES: { name: string; open: (page: Page) => Promise<void> }[] = [
  {
    name: 'the orders of the manager',
    open: async (page) => {
      await stubManagerOrders(page);
      await page.goto(APP_ROUTES.MANAGER_ORDERS);
      await expect(page.getByRole('table')).toBeVisible();
    },
  },
  {
    name: 'the support queue',
    open: async (page) => {
      await stubSupport(page);
      await page.goto(SUPPORT_PATH);
      await expect(page.getByRole('list', { name: 'Очередь обращений' })).toBeVisible();
    },
  },
  {
    name: 'the courier map',
    open: async (page) => {
      await stubCouriersMap(page);
      await page.goto(MAP_PATH);
      await expect(page.getByRole('region', { name: 'Курьеры на линии' })).toBeVisible();
    },
  },
  {
    name: 'the courier history',
    open: async (page) => {
      await openCourierHistory(page);
    },
  },
  {
    name: 'the orders of the client',
    open: async (page) => {
      await stubMyOrders(page);
      await page.goto(APP_ROUTES.ORDERS);
      await expect(page.getByRole('tabpanel').getByRole('link', { name: /^№/ })).toHaveCount(8);
    },
  },
];

for (const { name, open } of PAGES) {
  test(`should not ask the same thing twice on opening ${name}`, async ({ page }) => {
    const finished = collectFinished(page);

    await open(page);
    await page.waitForTimeout(SETTLE_MS);

    expect(finished.length).toBeGreaterThan(0);
    expect(repeated(finished)).toEqual([]);
  });
}

test('should keep the answer of the last tab when an older answer comes later', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.route(/\/api\/manager\/orders\?.*status=finished/, async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, SLOW_ANSWER_MS);
    });
    stub.status = 'delivered';
    await route.fallback().catch(() => undefined);
  });
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('tab', { name: /^Завершённые/ }).click();
  await page.getByRole('tab', { name: /^Активные/ }).click();
  await page.waitForTimeout(SLOW_ANSWER_MS + SETTLE_MS);

  await expect(page).toHaveURL(/status=active/);
  await expect(page.getByRole('table').getByText('Доставлен', { exact: true })).toHaveCount(0);
});
