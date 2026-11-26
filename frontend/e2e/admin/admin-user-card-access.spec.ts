import { expect, test } from '@playwright/test';
import { PASSWORD_LINK_TEXTS as LINK } from '../../src/features/password-link/config/texts';
import { DIALOG_TEXTS as DIALOG } from '../../src/pages/admin/user-card/config/dialog-texts';
import { USER_CARD_TEXTS as TEXTS } from '../../src/pages/admin/user-card/config/texts';
import { type AdminSession, openAdminSession } from '../support/admin/admin-users';
import {
  activeStaff,
  historyPanel,
  managePanel,
  newClient,
  openCard,
  runAction,
} from '../support/admin/admin-user-card';

const REASON = 'Оскорбления курьеров в чате заказа';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
let client: Awaited<ReturnType<typeof newClient>>;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
  client = await newClient(session.api);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should block a client with a reason and unblock them', async () => {
  const { page } = session;
  await openCard(page, client.userId);

  let dialog = await runAction(page, 'Заблокировать', DIALOG.BLOCK_TITLE);
  await expect(dialog.getByText('0 / 500')).toBeVisible();
  await dialog.getByRole('button', { name: DIALOG.BLOCK_CONFIRM }).click();
  await expect(dialog.getByText(DIALOG.REASON_REQUIRED)).toBeVisible();
  await dialog.getByLabel(DIALOG.REASON).fill(REASON);
  await expect(dialog.getByText(`${REASON.length} / 500`)).toBeVisible();
  await dialog.getByRole('button', { name: DIALOG.BLOCK_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  const blocked = page.getByRole('alert').filter({ hasText: 'Аккаунт заблокирован' });
  await expect(blocked).toContainText(`Причина: ${REASON}.`);
  await expect(blocked).toContainText(/Заблокировал: \S+ \S\./);
  await expect(page.getByText('Заблокирован', { exact: true }).first()).toBeVisible();
  await expect(historyPanel(page)).toContainText(`Причина: ${REASON}`);

  dialog = await runAction(page, 'Разблокировать', DIALOG.UNBLOCK_TITLE);
  await expect(dialog).toContainText('снова сможет входить в аккаунт и оформлять заказы');
  await dialog.getByRole('button', { name: DIALOG.UNBLOCK_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  await expect(blocked).toHaveCount(0);
  await expect(managePanel(page).getByRole('button', { name: 'Заблокировать' })).toBeVisible();
  await expect(historyPanel(page)).toContainText('Разблокирован');
});

test('should end all sessions of a client', async () => {
  const { page } = session;
  await openCard(page, client.userId);

  const dialog = await runAction(page, 'Завершить все сеансы', DIALOG.SESSIONS_TITLE);
  await expect(dialog).toContainText('Войти снова можно будет, это не блокировка.');
  await dialog.getByRole('button', { name: DIALOG.SESSIONS_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  await expect(historyPanel(page)).toContainText('Завершены все сеансы');
});

test('should reset the password of a staff member and show where the link went', async () => {
  const { page, api } = session;
  const manager = await activeStaff(api, 'manager');
  await openCard(page, manager.userId);

  const dialog = await runAction(page, 'Сбросить пароль', DIALOG.RESET_TITLE);
  await expect(dialog).toContainText(manager.email);
  await dialog.getByRole('button', { name: DIALOG.RESET_CONFIRM }).click();

  const done = page.getByRole('dialog', { name: /Письмо отправлено|Ссылка создана/ });
  await expect(done).toBeVisible();
  await expect(done).toContainText('Все сессии сотрудника уже завершены.');
  await expect(done.getByRole('button', { name: LINK.COPY })).toBeVisible();
  await done.getByRole('button', { name: LINK.DONE }).click();

  await expect(done).toBeHidden();
  await expect(historyPanel(page)).toContainText('Пароль сброшен');
});

test('should delete a client, leave no management and hide them from the list', async () => {
  const { page } = session;
  await openCard(page, client.userId);

  const dialog = await runAction(page, 'Удалить', DIALOG.DELETE_TITLE);
  await expect(dialog.getByRole('button', { name: DIALOG.DELETE_CONFIRM })).not.toBeFocused();
  await dialog.getByRole('button', { name: DIALOG.DELETE_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Удалённый пользователь');
  await expect(page.getByRole('status').filter({ hasText: 'Данные обезличены' })).toContainText(
    /Удалил: \S+ \S\./,
  );
  await expect(managePanel(page)).toHaveCount(0);
  await expect(page.getByRole('region', { name: TEXTS.CONTACTS })).toContainText(
    TEXTS.DELETED_VALUE,
  );
  await expect(historyPanel(page)).toContainText('Удалён, данные обезличены');

  const userLink = page.locator(`a[href^="/admin/users/${client.userId}?"]`);
  const listed = page.waitForResponse(
    (response) => response.url().includes('/api/admin/users?') && response.ok(),
  );
  await page.goto('/admin/users?role=client');
  await listed;
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(userLink).toHaveCount(0);
  await page.goto('/admin/users?role=client&status=deleted');
  await expect(userLink).toHaveCount(1);
});
