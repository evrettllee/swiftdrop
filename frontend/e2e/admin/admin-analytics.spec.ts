import { expect, test } from '@playwright/test';
import { ADMIN_ANALYTICS_PATH, stubAdminAnalytics } from '../support/admin/admin-analytics';

test('should render business tab by default and switch across all five admin tabs', async ({
  page,
}) => {
  const stub = await stubAdminAnalytics(page);
  await page.goto(ADMIN_ANALYTICS_PATH);

  await expect(page.getByText('6–12 ноября, сравнение с 30 октября – 5 ноября')).toBeVisible();
  await expect(page.getByText('Заказов оформлено')).toBeVisible();
  await expect(page.getByText('Воронка заказов')).toBeVisible();
  await expect(page.getByText('Отменены до оплаты')).toBeVisible();
  expect(stub.requests.map((entry) => entry.tab)).toEqual(['business']);

  await page.getByRole('tab', { name: 'Доставка' }).click();
  await expect(page).toHaveURL('/admin/analytics?tab=delivery');
  await expect(page.getByText('Доставлено вовремя по дням, %')).toBeVisible();
  const zoneRows = page.getByRole('table', { name: 'По зонам' }).locator('tbody tr');
  await expect(zoneRows).toHaveCount(4);
  await expect(zoneRows.nth(0)).toContainText('Минск');
  await expect(zoneRows.nth(3)).toContainText('Без зоны');

  await page.getByRole('tab', { name: 'Пользователи' }).click();
  await expect(page.getByText('Новые клиенты по дням')).toBeVisible();
  await expect(page.getByText('14 из 37')).toBeVisible();

  await page.getByRole('tab', { name: 'Поддержка' }).click();
  await expect(page.getByText('Проблема с заказом')).toBeVisible();
  await expect(page.getByText('дольше всех ждёт 18 мин')).toBeVisible();

  await page.getByRole('tab', { name: 'Сервис' }).click();
  await expect(page.getByText('последнее 10 ноя, 16:40')).toBeVisible();
  await expect(
    page
      .getByRole('table', { name: 'Последние сбои' })
      .getByText('Сервис маршрутов не ответил вовремя', {
        exact: true,
      }),
  ).toBeVisible();
  expect(stub.requests.map((entry) => entry.tab)).toEqual([
    'business',
    'delivery',
    'users',
    'support',
    'service',
  ]);
});

test('should preserve active tab on period change and recover from 429 throttle errors', async ({
  page,
}) => {
  const stub = await stubAdminAnalytics(page);
  await page.goto(`${ADMIN_ANALYTICS_PATH}?tab=users`);

  await expect(page.getByText('+23% к прошлой неделе')).toBeVisible();
  await page.getByRole('combobox', { name: 'Период' }).selectOption('30d');
  await expect(page).toHaveURL('/admin/analytics?period=30d&tab=users');
  await expect(
    page.getByText('14 октября – 12 ноября, сравнение с 14 сентября – 13 октября'),
  ).toBeVisible();
  await expect(page.getByText('+23% к прошлому периоду')).toBeVisible();

  stub.failureStatus = 429;
  await page.getByRole('tab', { name: 'Сервис' }).click();
  await expect(
    page.getByRole('alert').getByText('Слишком много запросов, попробуйте через минуту'),
  ).toBeVisible();

  stub.failureStatus = null;
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByText('Внешние сервисы')).toBeVisible();
});

test('should fit admin analytics on 375px phone viewport without horizontal page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await stubAdminAnalytics(page);
  await page.goto(ADMIN_ANALYTICS_PATH);

  await expect(page.getByRole('button', { name: 'Выгрузить' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Бизнес' })).toBeVisible();
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});

test('should keep loaded period labels consistent while a new period is loading', async ({
  page,
}) => {
  await stubAdminAnalytics(page);
  await page.goto(`${ADMIN_ANALYTICS_PATH}?tab=users`);
  await expect(page.getByText('+23% к прошлой неделе')).toBeVisible();

  let entered = false;
  let release: () => void = () => undefined;
  await page.route(/\/api\/admin\/analytics\/users\?from=2026-10-14/, async (route) => {
    entered = true;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fallback();
  });

  await page.getByRole('combobox', { name: 'Период' }).selectOption('30d');
  await expect(page).toHaveURL('/admin/analytics?period=30d&tab=users');
  await expect.poll(() => entered).toBe(true);
  await expect(page.getByText('+23% к прошлой неделе')).toBeVisible();
  await expect(page.getByText('+23% к прошлому периоду')).toHaveCount(0);

  release();
  await expect(page.getByText('+23% к прошлому периоду')).toBeVisible();
});
