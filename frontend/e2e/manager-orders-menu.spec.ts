import { expect, type Page, test } from '@playwright/test';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { FIRST_ORDER_ID, stubManagerOrders } from './support/manager-orders';

test.use({ viewport: { width: 1440, height: 1000 } });

const SECOND_ORDER_ID = FIRST_ORDER_ID - 1;

function menuButton(page: Page, orderId: number) {
  return page.getByRole('button', { name: `Действия с заказом №${orderId}` });
}

function menu(page: Page, orderId: number) {
  return page.getByRole('menu', { name: `Действия с заказом №${orderId}` });
}

async function openFirstMenu(page: Page): Promise<void> {
  const orders = await stubManagerOrders(page);
  orders.status = ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT;
  await page.goto('/manager/orders');
  await menuButton(page, FIRST_ORDER_ID).click();
  await expect(menu(page, FIRST_ORDER_ID)).toBeVisible();
}

test('should keep the menu above the next rows so a click there reaches the menu', async ({
  page,
}) => {
  await openFirstMenu(page);
  const box = await menuButton(page, SECOND_ORDER_ID).boundingBox();
  const point = {
    x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
    y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
  };

  const isInsideMenu = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="menu"]') !== null,
    point,
  );
  expect(isInsideMenu).toBe(true);
  await expect(menu(page, FIRST_ORDER_ID)).toHaveCSS('background-color', /rgb\(/);

  await page.mouse.click(point.x, point.y);
  await expect(menu(page, SECOND_ORDER_ID)).toHaveCount(0);
  await expect(menuButton(page, SECOND_ORDER_ID)).not.toHaveAttribute('aria-expanded', 'true');
});

test('should move through the items with the arrows and give the focus back on Escape', async ({
  page,
}) => {
  await openFirstMenu(page);
  const items = menu(page, FIRST_ORDER_ID).getByRole('menuitem');

  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(items.last()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu(page, FIRST_ORDER_ID)).toBeHidden();
  await expect(menuButton(page, FIRST_ORDER_ID)).toBeFocused();
});

test('should close the menu by a click outside it', async ({ page }) => {
  await openFirstMenu(page);

  await page.getByRole('heading', { level: 1 }).click();

  await expect(menu(page, FIRST_ORDER_ID)).toBeHidden();
});
