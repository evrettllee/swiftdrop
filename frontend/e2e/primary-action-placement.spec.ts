import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { stubAuthorSupport } from './support/author-support';
import { stubMyOrders } from './support/my-orders';
import { stubZones, ZONES_PATH } from './support/manager-zones';

const NEW_TICKET = { name: 'Новое обращение' };
const NEW_ZONE = { name: 'Новая зона' };
const NEW_ORDER = { name: 'Новый заказ' };
const COUNTS_LIMIT = '1';

async function holdTickets(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/api\/support\/tickets(\?.*)?$/, async (route) => {
    await held;
    await route.fallback();
  });

  return release;
}

test('should show the new ticket once: in the empty state, then in the header', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  const tickets = stub.tickets;
  stub.tickets = [];
  const release = await holdTickets(page);
  await page.goto(APP_ROUTES.SUPPORT);

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', NEW_TICKET)).toHaveCount(0);
  release();

  const panel = page.getByRole('tabpanel');
  await expect(panel.getByRole('heading', { name: 'Обращений пока нет' })).toBeVisible();
  await expect(page.getByRole('button', NEW_TICKET)).toHaveCount(1);
  await expect(panel.getByRole('button', NEW_TICKET)).toBeVisible();

  await page.getByRole('tab', { name: /Закрытые/ }).click();
  await expect(page.getByRole('button', NEW_TICKET)).toHaveCount(1);
  await expect(panel.getByRole('button', NEW_TICKET)).toHaveCount(0);

  stub.tickets = tickets;
  await page.goto(APP_ROUTES.SUPPORT);
  await expect(page.getByRole('list', { name: 'Мои обращения' })).toBeVisible();
  await expect(page.getByRole('button', NEW_TICKET)).toHaveCount(1);
  await expect(panel.getByRole('button', NEW_TICKET)).toHaveCount(0);
});

test('should show the new zone once: in the empty state, then in the header', async ({ page }) => {
  const stub = await stubZones(page);
  const zones = stub.zones;
  stub.zones = [];
  await page.goto(ZONES_PATH);

  const empty = page.getByRole('heading', { name: 'Зон пока нет' });
  await expect(empty).toBeVisible();
  await expect(page.getByRole('link', NEW_ZONE)).toHaveCount(1);

  stub.zones = zones;
  await page.reload();
  await expect(page.getByRole('table').or(page.getByRole('list')).first()).toBeVisible();
  await expect(page.getByRole('link', NEW_ZONE)).toHaveCount(1);
  await expect(empty).toHaveCount(0);
});

async function holdOrderCounts(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/api\/orders\?.*limit=1(&|$)/, async (route) => {
    await held;
    await route.fallback();
  });

  return release;
}

test('should keep the new order in the header while the counts load again', async ({ page }) => {
  await stubMyOrders(page);
  await page.goto(`${APP_ROUTES.ORDERS}?q=48090`);
  const title = page.getByRole('heading', { level: 1, name: 'Мои заказы' });
  const newOrder = page.locator('header').filter({ has: title }).getByRole('link', NEW_ORDER);
  await expect(newOrder).toBeVisible();

  const release = await holdOrderCounts(page);
  const counts = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('limit') === COUNTS_LIMIT,
  );
  await page.getByRole('button', { name: 'Очистить поиск' }).click();
  await counts;

  await expect(page).toHaveURL(APP_ROUTES.ORDERS);
  await expect(newOrder).toBeVisible();
  release();

  await expect(page.getByRole('tab', { name: /^Все/ })).toContainText('8');
  await expect(newOrder).toBeVisible();
});
