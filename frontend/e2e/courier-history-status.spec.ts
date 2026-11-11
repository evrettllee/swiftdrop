import { expect, type Page, test } from '@playwright/test';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { fullHistory, historyCards, lastListRequest } from './support/courier-history';
import {
  chips,
  openCourierHistory,
  periodButton,
  periodDialog,
  summary,
} from './support/courier-history-page';

const CANCELLED_URL = `${APP_ROUTES.COURIER_HISTORY}?status=cancelled`;

function withCancelled() {
  return fullHistory().map((item, index) =>
    index === 0 ? { ...item, status: ORDER_STATUS.CANCELLED } : item,
  );
}

function statusRadio(page: Page, name: string) {
  return periodDialog(page).getByRole('radio', { name, exact: true });
}

async function chooseStatus(page: Page, name: string) {
  await periodButton(page, 'Эта неделя').click();
  await periodDialog(page).getByText(name, { exact: true }).click();
  await expect(statusRadio(page, name)).toBeChecked();
  await periodDialog(page)
    .getByRole('button', { name: /^Показать/ })
    .click();
  await expect(periodDialog(page)).toBeHidden();
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('should keep to the cancelled orders through the address and the chip', async ({ page }) => {
    const stub = await openCourierHistory(page, '', withCancelled());
    await expect(historyCards(page)).toHaveCount(20);

    await periodButton(page, 'Эта неделя').click();
    await expect(statusRadio(page, 'Все')).toBeChecked();
    await page.keyboard.press('Escape');
    await chooseStatus(page, 'Отменённые');

    await expect(page).toHaveURL(CANCELLED_URL);
    await expect.poll(() => lastListRequest(stub)?.get('status')).toBe('cancelled');
    await expect(historyCards(page)).toHaveCount(1);
    await expect(historyCards(page).first()).toContainText('Отменён');
    await expect(summary(page)).toHaveCount(0);
    const chip = chips(page).getByRole('button', { name: /Убрать фильтр Статус/ });
    await expect(chip).toHaveText(/Статус:\s*отменённые/);

    await page.reload();
    await expect(chip).toBeVisible();
    await expect.poll(() => lastListRequest(stub)?.get('status')).toBe('cancelled');

    await chip.click();
    await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
    await expect.poll(() => lastListRequest(stub)?.get('status')).toBeNull();
    await expect(historyCards(page)).toHaveCount(20);
    await expect(summary(page)).toContainText('22 доставки');
  });

  test('should tell that the period has no cancelled orders', async ({ page }) => {
    await openCourierHistory(page, '?status=cancelled');

    await expect(
      page.getByRole('heading', { name: 'За этот период отменённых заказов нет' }),
    ).toBeVisible();
  });

  test('should return to every status by the reset of the panel', async ({ page }) => {
    await openCourierHistory(page, '?status=delivered');
    await expect(summary(page)).toContainText('23 доставки');
    await periodButton(page, 'Эта неделя').click();
    await expect(statusRadio(page, 'Доставленные')).toBeChecked();

    await periodDialog(page).getByRole('button', { name: 'Сбросить' }).click();
    await expect(statusRadio(page, 'Все')).toBeChecked();
    await periodDialog(page)
      .getByRole('button', { name: /^Показать/ })
      .click();

    await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should choose the status in the sheet of the period and show its chip', async ({
    page,
  }) => {
    const stub = await openCourierHistory(page, '', withCancelled());

    await chooseStatus(page, 'Отменённые');

    await expect(page).toHaveURL(CANCELLED_URL);
    await expect.poll(() => lastListRequest(stub)?.get('status')).toBe('cancelled');
    await expect(chips(page).getByRole('button', { name: /Убрать фильтр Статус/ })).toBeVisible();
    await expect(chips(page).getByRole('button', { name: /Убрать фильтр Период/ })).toHaveCount(0);
  });
});
