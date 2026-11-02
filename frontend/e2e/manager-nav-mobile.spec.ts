import { expect, test } from '@playwright/test';
import { MANAGER_LAYOUT_TEXTS } from '../src/app/layouts/manager-layout/navigation';
import { UI_TEXTS } from '../src/shared/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { managerMenu, openAsManager } from './support/manager';

test.use({ viewport: { width: 375, height: 844 } });

test('should show the bottom menu with the badges and open the rest in a sheet', async ({
  page,
}) => {
  await openAsManager(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  const bottom = managerMenu(page);
  await expect(bottom.getByRole('link', { name: 'Заказы, 3 требуют внимания' })).toBeVisible();
  await expect(bottom.getByRole('link', { name: 'Карта', exact: true })).toBeVisible();
  await expect(bottom.getByRole('link', { name: 'Поддержка, 2 без ответа' })).toBeVisible();

  await bottom.getByRole('button', { name: MANAGER_LAYOUT_TEXTS.NAV_MORE }).click();
  const sheet = page.getByRole('dialog', { name: MANAGER_LAYOUT_TEXTS.NAV_MORE });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('link')).toHaveText(['Зоны', 'Аналитика', 'Профиль']);

  await sheet.getByRole('link', { name: 'Зоны' }).click();

  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ZONES);
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: 'Зоны', exact: true })).toBeVisible();
  await expect(bottom.getByRole('button', { name: MANAGER_LAYOUT_TEXTS.NAV_MORE })).toHaveClass(
    /text-accent/,
  );
});

test('should close the sheet with the close button', async ({ page }) => {
  await openAsManager(page);
  await page.goto(APP_ROUTES.MANAGER_ORDERS);

  await managerMenu(page).getByRole('button', { name: MANAGER_LAYOUT_TEXTS.NAV_MORE }).click();
  const sheet = page.getByRole('dialog', { name: MANAGER_LAYOUT_TEXTS.NAV_MORE });
  await sheet.getByRole('button', { name: UI_TEXTS.CLOSE }).click();

  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ORDERS);
});
