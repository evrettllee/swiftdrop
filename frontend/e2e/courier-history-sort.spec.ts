import { expect, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  DESKTOP_VIEWPORT,
  fullHistory,
  historyCards,
  lastListRequest,
  NEWEST_ORDER_ID,
} from './support/courier-history';
import { openCourierHistory } from './support/courier-history-page';

test.use({ viewport: DESKTOP_VIEWPORT });

const FARTHEST_INDEX = 7;
const NEAREST_INDEX = 12;

function withDistances() {
  return fullHistory().map((item, index) => ({
    ...item,
    distanceKm: index === FARTHEST_INDEX ? 24.6 : index === NEAREST_INDEX ? 0.9 : item.distanceKm,
  }));
}

test('should sort by the distance both ways and keep it after a reload', async ({ page }) => {
  const stub = await openCourierHistory(page, '', withDistances());
  const sort = page.getByRole('combobox', { name: 'Сортировка' });

  await sort.selectOption('Сначала дальние');

  await expect(page).toHaveURL(`${APP_ROUTES.COURIER_HISTORY}?sort=distanceKm%3Adesc`);
  await expect(historyCards(page).first()).toContainText(`№${NEWEST_ORDER_ID - FARTHEST_INDEX}`);
  await expect.poll(() => lastListRequest(stub)?.get('sort')).toBe('distanceKm:desc');

  await sort.selectOption('Сначала ближние');

  await expect(historyCards(page).first()).toContainText(`№${NEWEST_ORDER_ID - NEAREST_INDEX}`);
  await page.reload();
  await expect(sort).toHaveValue('distanceKm:asc');
});
