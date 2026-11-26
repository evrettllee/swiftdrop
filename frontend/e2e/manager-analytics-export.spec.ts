import { expect, test } from '@playwright/test';
import { ANALYTICS_EXPORT_TEXTS } from '../src/features/analytics-export/config/export-config';
import { ANALYTICS_PATH, stubAnalytics } from './support/manager-analytics';

const MANAGER_EXPORT_URL = /\/api\/manager\/analytics\/export(\?.*)?$/;

test('should open export window from manager analytics and download XLSX and CSV reports', async ({
  page,
}) => {
  const captured: URLSearchParams[] = [];
  await stubAnalytics(page);
  await page.route(MANAGER_EXPORT_URL, (route) => {
    const search = new URL(route.request().url()).searchParams;
    captured.push(search);
    const format = search.get('format') === 'csv' ? 'csv' : 'xlsx';

    return route.fulfill({
      body: 'manager-analytics',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="swiftdrop-manager-analytics-2026-10-20-2026-10-26.${format}"`,
      },
    });
  });

  await page.goto(ANALYTICS_PATH);
  await page.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.BUTTON }).click();

  const dialog = page.getByRole('dialog', { name: ANALYTICS_EXPORT_TEXTS.TITLE });
  await expect(dialog.getByText('20–26 октября 2026')).toBeVisible();
  await expect(dialog.getByLabel('По часам')).toBeChecked();

  const xlsxDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.SUBMIT }).click();
  expect((await xlsxDownload).suggestedFilename()).toBe(
    'swiftdrop-manager-analytics-2026-10-20-2026-10-26.xlsx',
  );
  expect(Object.fromEntries(captured[0])).toEqual({
    from: '2026-10-20',
    to: '2026-10-26',
    format: 'xlsx',
    sections: 'summary,days,hours,zones,couriers',
  });
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.BUTTON }).click();
  await dialog.getByText('CSV', { exact: true }).click();
  await expect(dialog.getByText('Сводка', { exact: true })).toHaveCount(0);
  await dialog.getByText('По часам', { exact: true }).click();
  const csvDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: ANALYTICS_EXPORT_TEXTS.SUBMIT }).click();
  expect((await csvDownload).suggestedFilename()).toBe(
    'swiftdrop-manager-analytics-2026-10-20-2026-10-26.csv',
  );
  expect(Object.fromEntries(captured[1])).toEqual({
    from: '2026-10-20',
    to: '2026-10-26',
    format: 'csv',
    sections: 'hours',
  });
});
