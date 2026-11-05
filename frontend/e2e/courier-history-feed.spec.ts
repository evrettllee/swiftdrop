import { expect, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { historyCards, lastListRequest } from './support/courier-history';
import {
  chips,
  openCourierHistory,
  periodButton,
  periodDialog,
  summary,
} from './support/courier-history-page';

test.use({ viewport: { width: 375, height: 812 } });

test('should show more deliveries by the cursor under the summary', async ({ page }) => {
  const stub = await openCourierHistory(page);

  await expect(summary(page)).toContainText('23 доставки');
  await expect(page.getByText('Показано 5 из 23')).toBeVisible();
  await expect.poll(() => lastListRequest(stub)?.get('cursor')).toBe('');

  await page.getByRole('button', { name: 'Показать ещё' }).click();

  await expect(historyCards(page)).toHaveCount(10);
  await expect.poll(() => lastListRequest(stub)?.get('cursor')).toBe('5');
  await expect(summary(page)).toContainText('23 доставки');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('should tell an empty period and reset it with the chip', async ({ page }) => {
  await openCourierHistory(page);

  await periodButton(page, 'Эта неделя').click();
  await periodDialog(page).getByText('Прошлая неделя', { exact: true }).click();
  await periodDialog(page)
    .getByRole('button', { name: /^Показать/ })
    .click();

  await expect(page.getByRole('heading', { name: 'За этот период доставок нет' })).toBeVisible();
  await chips(page)
    .getByRole('button', { name: /^Убрать фильтр Период/ })
    .click();

  await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
  await expect(historyCards(page)).toHaveCount(5);
  await expect(chips(page)).toHaveCount(0);
});
