import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { CALENDAR_PERIOD } from '../src/shared/lib/calendar/period';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  fullHistory,
  historyCards,
  lastListRequest,
  NEWEST_ORDER_ID,
  thisMonday,
} from './support/courier-history';
import {
  chips,
  openCourierHistory,
  periodButton,
  periodDialog,
  summary,
  weekOf,
} from './support/courier-history-page';

test.use({ viewport: { width: 1440, height: 1000 } });

test('should open this week with its summary and keep it out of the address', async ({ page }) => {
  const stub = await openCourierHistory(page);
  const week = weekOf(CALENDAR_PERIOD.THIS_WEEK);

  await expect(periodButton(page, 'Эта неделя')).toBeVisible();
  await expect(summary(page)).toContainText('23 доставки');
  await expect(summary(page)).toContainText('183,5 км');
  await expect(historyCards(page)).toHaveCount(20);
  await expect(page.getByText('1–20 из 23')).toBeVisible();
  await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
  await expect.poll(() => lastListRequest(stub)?.get('from')).toBe(week.from);
  await expect.poll(() => lastListRequest(stub)?.get('to')).toBe(week.to);
  await expect.poll(() => lastListRequest(stub)?.get('sort')).toBeNull();
});

test('should count only the delivered orders in the summary', async ({ page }) => {
  const items = fullHistory().map((item, index) =>
    index === 0 ? { ...item, status: ORDER_STATUS.CANCELLED } : item,
  );
  await openCourierHistory(page, '', items);

  await expect(summary(page)).toContainText('22 доставки');
  await expect(historyCards(page).first()).toContainText('Отменён');
});

test('should find an order by its number and ask for digits only', async ({ page }) => {
  const stub = await openCourierHistory(page);
  const search = page.getByRole('searchbox', { name: 'Поиск по номеру заказа' });

  await search.fill(String(NEWEST_ORDER_ID - 3));
  await expect(page).toHaveURL(`${APP_ROUTES.COURIER_HISTORY}?q=${NEWEST_ORDER_ID - 3}`);
  await expect(historyCards(page)).toHaveCount(1);
  await expect(summary(page)).toContainText('1 доставка');

  await page.reload();
  await expect(search).toHaveValue(String(NEWEST_ORDER_ID - 3));

  await search.fill('Немига');
  await expect(page.getByText('Введите номер заказа цифрами')).toBeVisible();
  await expect.poll(() => lastListRequest(stub)?.get('q')).not.toBe('Немига');
});

test('should choose the presets and an own period, keep them after a reload and go back', async ({
  page,
}) => {
  const stub = await openCourierHistory(page);
  const lastWeek = weekOf(CALENDAR_PERIOD.LAST_WEEK);

  await periodButton(page, 'Эта неделя').click();
  await periodDialog(page).getByText('Прошлая неделя', { exact: true }).click();
  await periodDialog(page)
    .getByRole('button', { name: /^Показать/ })
    .click();

  await expect(page).toHaveURL(`${APP_ROUTES.COURIER_HISTORY}?period=last_week`);
  await expect.poll(() => lastListRequest(stub)?.get('from')).toBe(lastWeek.from);
  await expect(page.getByRole('heading', { name: 'За этот период доставок нет' })).toBeVisible();
  await expect(summary(page)).toHaveCount(0);
  await expect(chips(page)).toContainText('Прошлая неделя');

  await page.reload();
  await expect(periodButton(page, 'Прошлая неделя')).toBeVisible();

  await periodButton(page, 'Прошлая неделя').click();
  await periodDialog(page).getByText('Свой период', { exact: true }).click();
  await periodDialog(page).getByLabel('С', { exact: true }).fill(thisMonday());
  await periodDialog(page).getByLabel('По', { exact: true }).fill(thisMonday());
  await periodDialog(page).getByRole('button', { name: 'Показать 23 заказа' }).click();

  await expect(page).toHaveURL(
    `${APP_ROUTES.COURIER_HISTORY}?period=custom&from=${thisMonday()}&to=${thisMonday()}`,
  );
  await expect(historyCards(page)).toHaveCount(20);

  await page.goBack();
  await expect(page).toHaveURL(`${APP_ROUTES.COURIER_HISTORY}?period=last_week`);

  await chips(page).getByRole('button', { name: 'Сбросить всё' }).click();
  await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
  await expect(historyCards(page)).toHaveCount(20);
});

test('should sum the whole time', async ({ page }) => {
  const stub = await openCourierHistory(page, '?period=all');

  await expect(periodButton(page, 'Всё время')).toBeVisible();
  await expect(summary(page)).toContainText('Всего: 23 доставки, 183,5 км');
  await expect.poll(() => lastListRequest(stub)?.has('from')).toBe(false);
});

test('should sort the oldest first and keep it after a reload', async ({ page }) => {
  const stub = await openCourierHistory(page);

  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('Сначала старые');

  await expect(page).toHaveURL(`${APP_ROUTES.COURIER_HISTORY}?sort=finishedAt%3Aasc`);
  await expect(historyCards(page).first()).toContainText(`№${NEWEST_ORDER_ID - 22}`);
  await expect.poll(() => lastListRequest(stub)?.get('sort')).toBe('finishedAt:asc');

  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveValue('finishedAt:asc');
});

test('should keep the pages in place when a new delivery comes', async ({ page }) => {
  const stub = await openCourierHistory(page);
  await expect(page.getByText('1–20 из 23')).toBeVisible();

  stub.items.unshift({ ...stub.items[0], orderId: NEWEST_ORDER_ID + 1 });
  await page.getByRole('button', { name: 'Следующая страница' }).click();

  await expect(page).toHaveURL(`${APP_ROUTES.COURIER_HISTORY}?page=2`);
  await expect(page.getByText('21–23 из 23')).toBeVisible();
  await expect(historyCards(page).first()).toContainText(`№${NEWEST_ORDER_ID - 20}`);
  await expect.poll(() => lastListRequest(stub)?.get('until')).toBe(String(NEWEST_ORDER_ID));
});

test('should reset the period panel to this week', async ({ page }) => {
  await openCourierHistory(page, '?period=all');

  await periodButton(page, 'Всё время').click();
  await periodDialog(page).getByRole('button', { name: 'Сбросить' }).click();

  await expect(periodDialog(page).getByRole('radio', { name: 'Эта неделя' })).toBeChecked();
  await periodDialog(page)
    .getByRole('button', { name: /^Показать/ })
    .click();
  await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
});
