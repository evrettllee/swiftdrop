import { expect, test } from '@playwright/test';
import { ANALYTICS_PATH, periodOf, stubAnalytics } from './support/manager-analytics';

const DEBOUNCE_WAIT_MS = 600;

test('should keep the chosen period in the address and leave 7 days out of it', async ({
  page,
}) => {
  const stub = await stubAnalytics(page);
  await page.goto(ANALYTICS_PATH);
  const period = page.getByRole('combobox', { name: 'Период' });
  await expect(page.getByText('20–26 октября, сравнение с 13–19 октября')).toBeVisible();

  await period.selectOption('30d');
  await expect(page).toHaveURL(`${ANALYTICS_PATH}?period=30d`);
  await expect(
    page.getByText('27 сентября – 26 октября, сравнение с 28 августа – 26 сентября'),
  ).toBeVisible();
  expect(periodOf(stub.summaries.at(-1))).toBe('2026-09-27..2026-10-26');

  await period.selectOption('7d');
  await expect(page).toHaveURL(ANALYTICS_PATH);
  await expect(page.getByText('20–26 октября, сравнение с 13–19 октября')).toBeVisible();
});

test('should ask only for the last period when it is switched quickly', async ({ page }) => {
  const stub = await stubAnalytics(page);
  await page.goto(ANALYTICS_PATH);
  await expect(page.getByText('20–26 октября, сравнение с 13–19 октября')).toBeVisible();
  const period = page.getByRole('combobox', { name: 'Период' });

  await period.selectOption('30d');
  await period.selectOption('90d');
  await expect(page.getByText(/^29 июля – 26 октября/)).toBeVisible();
  await page.waitForTimeout(DEBOUNCE_WAIT_MS);

  const asked = stub.summaries.map(periodOf);
  expect(asked).not.toContain('2026-09-27..2026-10-26');
  expect(asked.at(-1)).toBe('2026-07-29..2026-10-26');
  expect(stub.couriers.map(periodOf)).not.toContain('2026-09-27..2026-10-26');
});

test('should take a custom period up to 92 days and show the error under the fields', async ({
  page,
}) => {
  const stub = await stubAnalytics(page);
  await page.goto(ANALYTICS_PATH);
  await expect(page.getByText('20–26 октября, сравнение с 13–19 октября')).toBeVisible();

  await page.getByRole('combobox', { name: 'Период' }).selectOption('custom');
  await expect(page).toHaveURL(`${ANALYTICS_PATH}?period=custom&from=2026-10-20&to=2026-10-26`);
  const from = page.getByLabel('С', { exact: true });
  const to = page.getByLabel('По', { exact: true });
  await expect(from).toHaveValue('2026-10-20');

  await from.fill('2026-07-01');
  await expect(page.getByText('Период — не больше 92 дней')).toBeVisible();
  await expect(from).toHaveAttribute('aria-invalid', 'true');
  await expect(to).toHaveAccessibleDescription('Период — не больше 92 дней');
  await page.waitForTimeout(DEBOUNCE_WAIT_MS);
  expect(stub.summaries.map(periodOf)).not.toContain('2026-07-01..2026-10-26');
  await expect(page.getByText('20–26 октября, сравнение с 13–19 октября')).toBeVisible();

  await from.fill('2026-08-01');
  await to.fill('2026-10-31');
  await expect(page.getByText('Период — не больше 92 дней')).toHaveCount(0);
  await expect(page).toHaveURL(`${ANALYTICS_PATH}?period=custom&from=2026-08-01&to=2026-10-31`);
  await expect.poll(() => periodOf(stub.summaries.at(-1))).toBe('2026-08-01..2026-10-31');

  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Период' })).toHaveValue('custom');
  await expect(page.getByLabel('По', { exact: true })).toHaveValue('2026-10-31');
});

test('should explain the request limit and load again on retry', async ({ page }) => {
  const stub = await stubAnalytics(page);
  stub.failure = 429;
  await page.goto(ANALYTICS_PATH);

  const alerts = page.getByRole('alert').filter({
    hasText: 'Слишком много запросов, попробуйте через минуту',
  });
  await expect(alerts).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Ключевые показатели' })).toHaveCount(0);

  stub.failure = null;
  await page.getByRole('button', { name: 'Повторить' }).first().click();
  await expect(page.getByRole('region', { name: 'Ключевые показатели' })).toBeVisible();
  await expect(alerts).toHaveCount(1);
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByRole('table', { name: 'Курьеры за период' })).toBeVisible();
});
