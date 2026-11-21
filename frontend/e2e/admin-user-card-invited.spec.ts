import { expect, test } from '@playwright/test';
import { PASSWORD_LINK_TEXTS as LINK } from '../src/features/password-link/config/texts';
import { DIALOG_TEXTS as DIALOG } from '../src/pages/admin/user-card/config/dialog-texts';
import { USER_CARD_TEXTS as TEXTS } from '../src/pages/admin/user-card/config/texts';
import { type AdminSession, openAdminSession } from './support/admin-users';
import {
  historyPanel,
  invitedStaff,
  managePanel,
  openCard,
  runAction,
} from './support/admin-user-card';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should show an invited member and send the invitation again', async () => {
  const { page, api } = session;
  const invited = await invitedStaff(api, 'manager');
  await openCard(page, invited.userId);

  await expect(page.getByRole('status').filter({ hasText: 'Приглашение отправлено' })).toContainText(
    'Сотрудник ещё не создал пароль. Ссылка действует до',
  );
  await expect(page.getByText('Приглашён', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: TEXTS.CONTACTS })).toContainText(
    'Пароль не создан',
  );
  await expect(page.getByRole('region', { name: TEXTS.CONTACTS })).toContainText('Входов не было');
  await expect(managePanel(page).getByRole('button')).toHaveText([
    'Изменить данные',
    'Отправить приглашение заново',
    'Удалить',
  ]);

  const dialog = await runAction(page, 'Отправить приглашение заново', DIALOG.RESEND_TITLE);
  await expect(dialog).toContainText(invited.email);
  await dialog.getByRole('button', { name: DIALOG.RESEND_CONFIRM }).click();

  const done = page.getByRole('dialog', { name: /Письмо отправлено|Приглашение создано/ });
  await expect(done).toBeVisible();
  await expect(done.getByText(LINK.FALLBACK_TITLE)).toBeVisible();
  await done.getByRole('button', { name: LINK.COPY }).click();
  await expect(done.getByRole('button', { name: LINK.COPIED })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('/set-password/');

  await done.getByRole('button', { name: LINK.DONE }).click();

  await expect(done).toBeHidden();
  await expect(historyPanel(page)).toContainText('Приглашение отправлено заново');
});
