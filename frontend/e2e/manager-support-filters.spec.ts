import { expect, type Page, test } from '@playwright/test';
import { stubSupport, SUPPORT_PATH, ticketsOf } from './support/manager-support';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function filtersButton(page: Page) {
  return page.getByRole('button', { name: /^Фильтры/ });
}

function panel(page: Page) {
  return page.getByRole('dialog', { name: 'Фильтры' });
}

function chips(page: Page) {
  return page.getByRole('group', { name: 'Применённые фильтры' });
}

function queue(page: Page) {
  return page.getByRole('list', { name: 'Очередь обращений' }).getByRole('listitem');
}

function lastQuery(stub: Awaited<ReturnType<typeof stubSupport>>) {
  return ticketsOf(stub, 'awaiting').at(-1);
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should filter the queue by topics and a period through the address and the chips', async ({
    page,
  }) => {
    const stub = await stubSupport(page);
    stub.tickets[0].topic = 'payment';
    await page.goto(SUPPORT_PATH);
    await expect(queue(page)).toHaveCount(2);

    await filtersButton(page).click();
    await expect(panel(page).getByRole('checkbox')).toHaveCount(6);
    await panel(page).getByText('Оплата', { exact: true }).click();
    await panel(page).getByText('Другое', { exact: true }).click();
    await panel(page).getByText('Последние 7 дней').click();
    await panel(page).getByRole('button', { name: 'Показать обращения' }).click();

    await expect(panel(page)).toBeHidden();
    await expect(page).toHaveURL(/topic=payment%2Cother/);
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}/);
    await expect.poll(() => lastQuery(stub)?.get('topic')).toBe('payment,other');
    expect(lastQuery(stub)?.get('from')).toMatch(DATE);
    await expect(queue(page)).toHaveCount(1);
    await expect(chips(page).getByRole('button')).toHaveText([
      /Тема:\s*оплата, другое/,
      /Создано:\s*7 дней/,
      'Сбросить всё',
    ]);
    await expect(filtersButton(page)).toContainText('2');

    await page.reload();
    await expect(chips(page).getByRole('button', { name: /Убрать фильтр Тема/ })).toBeVisible();
    await expect.poll(() => lastQuery(stub)?.get('topic')).toBe('payment,other');

    await chips(page)
      .getByRole('button', { name: /Убрать фильтр Тема/ })
      .click();
    await expect(page).not.toHaveURL(/topic=/);
    await expect.poll(() => lastQuery(stub)?.get('topic')).toBeNull();

    await chips(page).getByRole('button', { name: 'Сбросить всё' }).click();
    await expect(page).toHaveURL(SUPPORT_PATH);
    await expect.poll(() => lastQuery(stub)?.get('from')).toBeNull();
    await expect(chips(page)).toHaveCount(0);
  });

  test('should clear the topics and the period by the reset of the panel', async ({ page }) => {
    await stubSupport(page);
    await page.goto(`${SUPPORT_PATH}?topic=app`);
    await filtersButton(page).click();
    const app = panel(page).getByRole('checkbox', { name: 'Работа приложения' });
    await expect(app).toBeChecked();

    await panel(page).getByRole('button', { name: 'Сбросить' }).click();
    await expect(app).not.toBeChecked();
    await panel(page).getByRole('button', { name: 'Показать обращения' }).click();

    await expect(page).toHaveURL(SUPPORT_PATH);
  });

  test('should take the defaults in place of an unknown topic in the address', async ({ page }) => {
    const stub = await stubSupport(page);
    await page.goto(`${SUPPORT_PATH}?topic=refund`);

    await expect(queue(page)).toHaveCount(2);
    expect(lastQuery(stub)?.get('topic')).toBeNull();
    await expect(chips(page)).toHaveCount(0);
  });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('should choose the filters in a sheet', async ({ page }) => {
    const stub = await stubSupport(page);
    await page.goto(SUPPORT_PATH);
    await expect(queue(page)).toHaveCount(2);

    await filtersButton(page).click();
    await panel(page).getByText('Аккаунт', { exact: true }).click();
    await panel(page).getByText('Последние 30 дней').click();
    await panel(page).getByRole('button', { name: 'Показать обращения' }).click();

    await expect(panel(page)).toBeHidden();
    await expect(page).toHaveURL(/topic=account/);
    await expect.poll(() => lastQuery(stub)?.get('topic')).toBe('account');
    await expect(chips(page).getByRole('button', { name: /Создано 30 дней/ })).toBeVisible();
  });
});
