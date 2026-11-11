import { expect, type Page, test } from '@playwright/test';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { countListeners, type ListenerCounts, listenersOf } from './support/listener-counter';
import { managerMenu, openAsManager } from './support/manager';
import { stubMapbox } from './support/mapbox';

const ROUNDS = 3;
const SETTLE_MS = 800;
const ZONES = /^Зоны/;
const PAGES = [/^Карта курьеров/, /^Поддержка/, ZONES, /^Заказы/];

test.use({ viewport: { width: 1440, height: 900 } });
test.setTimeout(120_000);

async function walk(page: Page): Promise<ListenerCounts> {
  for (const name of PAGES) {
    await managerMenu(page).getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    if (name === ZONES) {
      await page.getByRole('main').getByRole('link', { name: 'Новая зона' }).first().click();
      await expect(page).toHaveURL(/\/manager\/zones\/new$/);
      await expect(page.locator('.leaflet-container')).toBeVisible();
    }
  }
  await page.waitForTimeout(SETTLE_MS);

  return listenersOf(page);
}

test('should take the listeners and the timers away when the pages of the manager change', async ({
  page,
}) => {
  await countListeners(page);
  await page.route(new RegExp(`^https?://[^/]+${API_BASE_PATH}/`), (route) =>
    route.fulfill({ status: 404, json: { message: 'Не найдено' } }),
  );
  await openAsManager(page);
  await stubMapbox(page);
  await page.goto('/manager/orders');
  await expect(page.getByRole('heading', { level: 1, name: 'Заказы' })).toBeVisible();

  const first = await walk(page);
  const rounds: ListenerCounts[] = [];

  for (let round = 1; round < ROUNDS; round += 1) {
    rounds.push(await walk(page));
  }

  test.info().annotations.push({
    type: 'listeners and intervals per round',
    description: JSON.stringify([first, ...rounds]),
  });
  expect(first.listeners).toBeGreaterThan(0);
  for (const counts of rounds) {
    expect(counts.listeners).toBeLessThanOrEqual(first.listeners);
    expect(counts.intervals).toBeLessThanOrEqual(first.intervals);
  }
});
