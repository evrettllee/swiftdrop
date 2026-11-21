import { expect, test } from '@playwright/test';
import { DIALOG_TEXTS as DIALOG } from '../src/pages/admin/user-card/config/dialog-texts';
import { USER_CARD_TEXTS as TEXTS } from '../src/pages/admin/user-card/config/texts';
import { type AdminSession, openAdminSession } from './support/admin-users';
import { activeStaff, historyPanel, openCard, runAction } from './support/admin-user-card';

const ACTIVE_ORDER = 'Есть активный заказ. Сменить роль можно после его завершения';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should make a courier a manager and back, writing both to the history', async () => {
  const { page, api } = session;
  const courier = await activeStaff(api, 'courier');
  await openCard(page, courier.userId);
  const crumbs = page.getByRole('navigation', { name: TEXTS.BREADCRUMBS_LABEL });

  let dialog = await runAction(page, 'Сменить роль', DIALOG.ROLE_TITLE);
  await expect(dialog).toContainText('станет менеджером');
  await dialog.getByRole('button', { name: DIALOG.ROLE_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Менеджер', { exact: true })).toBeVisible();
  await expect(crumbs.getByRole('link', { name: 'Менеджеры' })).toBeVisible();
  await expect(page.getByRole('region', { name: TEXTS.WORK })).toHaveCount(0);
  await expect(historyPanel(page)).toContainText('Курьер → менеджер');

  dialog = await runAction(page, 'Сменить роль', DIALOG.ROLE_TITLE);
  await expect(dialog).toContainText('станет курьером');
  await dialog.getByRole('button', { name: DIALOG.ROLE_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Курьер', { exact: true })).toBeVisible();
  await expect(historyPanel(page)).toContainText('Менеджер → курьер');
  await expect(historyPanel(page).getByText('Роль изменена')).toHaveCount(2);
});

test('should keep the window open with the reason when the server refuses', async () => {
  const { page, api } = session;
  const courier = await activeStaff(api, 'courier');
  await page.route(`**/api/admin/users/${courier.userId}/role`, (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 409, message: ACTIVE_ORDER }),
    }),
  );
  await openCard(page, courier.userId);

  const dialog = await runAction(page, 'Сменить роль', DIALOG.ROLE_TITLE);
  await dialog.getByRole('button', { name: DIALOG.ROLE_CONFIRM }).click();

  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('Есть активный заказ');
  await expect(alert).toContainText('Сменить роль можно после его завершения.');
  await expect(dialog.getByRole('button', { name: DIALOG.ROLE_CONFIRM })).toBeDisabled();
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: DIALOG.CANCEL }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Курьер', { exact: true })).toBeVisible();
  await page.unroute(`**/api/admin/users/${courier.userId}/role`);
});
