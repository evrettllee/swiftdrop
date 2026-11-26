import { expect, test, type Page } from '@playwright/test';
import { ANALYTICS_EXPORT_TEXTS } from '../src/features/analytics-export/config/export-config';
import { ADMIN_ANALYTICS_PATH, stubAdminAnalytics } from './support/admin-analytics';

function exportDialog(page: Page) {
  return page.getByRole('dialog', { name: ANALYTICS_EXPORT_TEXTS.TITLE });
}

test('should export selected XLSX sheets and validate at least one section', async ({ page }) => {
  const stub = await stubAdminAnalytics(page);
  await page.goto(ADMIN_ANALYTICS_PATH);

  await page.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.BUTTON }).click();
  const dialog = exportDialog(page);
  await expect(dialog.getByText('6–12 ноября 2026')).toBeVisible();
  await expect(dialog.getByText('По умолчанию выгружается всё')).toBeVisible();

  await dialog.getByText('Сводка', { exact: true }).click();
  await dialog.getByText('Сбои', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.SUBMIT }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('swiftdrop-analytics-2026-11-06-2026-11-12.xlsx');
  expect(Object.fromEntries(stub.exports[0])).toEqual({
    from: '2026-11-06',
    to: '2026-11-12',
    format: 'xlsx',
    sections: 'days,zones,couriers',
  });
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.BUTTON }).click();
  for (const label of ['Сводка', 'По дням', 'По зонам', 'Курьеры', 'Сбои']) {
    await dialog.getByText(label, { exact: true }).click();
  }
  await expect(dialog.getByText('Выберите хотя бы один раздел')).toBeVisible();
  await expect(dialog.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.SUBMIT })).toBeDisabled();
});

test('should export single CSV table without Summary and display server errors', async ({
  page,
}) => {
  const stub = await stubAdminAnalytics(page);
  await page.goto(ADMIN_ANALYTICS_PATH);

  await page.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.BUTTON }).click();
  const dialog = exportDialog(page);
  await dialog.getByText('CSV', { exact: true }).click();
  await expect(dialog.getByText('Сводка', { exact: true })).toHaveCount(0);
  await dialog.getByText('Сбои', { exact: true }).click();

  let release: () => void = () => undefined;
  stub.exportAnswer = async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.fulfill({ status: 400, json: { message: 'Неизвестный раздел' } });
  };

  const submit = dialog.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.SUBMIT });
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAttribute('aria-busy', 'true');
  release();

  await expect(dialog.getByRole('alert').getByText('Неизвестный раздел')).toBeVisible();
  await expect(submit).toBeEnabled();

  stub.exportAnswer = null;
  const downloadPromise = page.waitForEvent('download');
  await submit.click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    'swiftdrop-analytics-2026-11-06-2026-11-12.csv',
  );
  expect(Object.fromEntries(stub.exports[1])).toEqual({
    from: '2026-11-06',
    to: '2026-11-12',
    format: 'csv',
    sections: 'failures',
  });
});
