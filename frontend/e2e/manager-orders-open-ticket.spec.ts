import { expect, type Page, test } from '@playwright/test';
import {
  EXPORT_TEXTS,
  FILTER_TEXTS,
  MANAGER_ORDERS_TEXTS,
} from '../src/pages/manager/orders/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { lastList, stubManagerOrders } from './support/manager-orders';

const CHIPS = { name: MANAGER_ORDERS_TEXTS.APPLIED_FILTERS };
const FILTERED_URL = `${APP_ROUTES.MANAGER_ORDERS}?hasOpenTicket=true`;

function openPanel(page: Page) {
  return page.getByRole('button', { name: /^Фильтры/ }).click();
}

function panel(page: Page) {
  return page.getByRole('dialog', { name: MANAGER_ORDERS_TEXTS.FILTERS_PANEL });
}

function checkbox(page: Page) {
  return panel(page).getByRole('checkbox', { name: FILTER_TEXTS.OPEN_TICKET_ONLY });
}

test('should keep to the orders with an open ticket through the address, the chip and the reset', async ({
  page,
}) => {
  const stub = await stubManagerOrders(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);
  await expect(page.getByRole('table')).toBeVisible();

  await openPanel(page);
  await panel(page).getByText(FILTER_TEXTS.OPEN_TICKET_ONLY).click();
  await expect(checkbox(page)).toBeChecked();
  await expect.poll(() => stub.counts.at(-1)?.searchParams.get('hasOpenTicket')).toBe('true');
  await panel(page)
    .getByRole('button', { name: /^Показать/ })
    .click();

  await expect(page).toHaveURL(FILTERED_URL);
  await expect.poll(() => lastList(stub).get('hasOpenTicket')).toBe('true');
  const chip = page.getByRole('group', CHIPS).getByRole('button', { name: /Обращение/ });
  await expect(chip).toHaveText(/Обращение:\s*открыто/);
  await expect(page.getByRole('button', { name: /^Фильтры/ })).toContainText('1');

  await page.reload();
  await expect(chip).toBeVisible();
  await expect.poll(() => lastList(stub).get('hasOpenTicket')).toBe('true');
  await openPanel(page);
  await expect(checkbox(page)).toBeChecked();
  await page.keyboard.press('Escape');

  await chip.click();
  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ORDERS);
  await expect.poll(() => lastList(stub).get('hasOpenTicket')).toBeNull();
  await expect(page.getByRole('group', CHIPS)).toHaveCount(0);
});

test('should clear the open ticket filter by the reset of the panel', async ({ page }) => {
  await stubManagerOrders(page);
  await page.goto(FILTERED_URL);
  await expect(page.getByRole('table')).toBeVisible();

  await openPanel(page);
  await expect(checkbox(page)).toBeChecked();
  await panel(page).getByRole('button', { name: MANAGER_ORDERS_TEXTS.RESET }).click();
  await expect(checkbox(page)).not.toBeChecked();
  await panel(page)
    .getByRole('button', { name: /^Показать/ })
    .click();

  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ORDERS);
});

test('should export the orders with an open ticket only', async ({ page }) => {
  const stub = await stubManagerOrders(page);
  await page.goto(FILTERED_URL);
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: MANAGER_ORDERS_TEXTS.EXPORT, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: EXPORT_TEXTS.TITLE });
  await expect(dialog.getByText('По текущим фильтрам: все, есть открытое обращение')).toBeVisible();

  await dialog.getByRole('button', { name: EXPORT_TEXTS.SUBMIT }).click();

  await expect.poll(() => stub.exports.at(0)?.searchParams.get('hasOpenTicket')).toBe('true');
});
