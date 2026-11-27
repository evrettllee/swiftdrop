import { expect, test } from '@playwright/test';
import { DIALOG_TEXTS as DIALOG } from '../../src/pages/admin/user-card/config/dialog-texts';
import { USER_CARD_TEXTS as TEXTS } from '../../src/pages/admin/user-card/config/texts';
import { PERSON_VALIDATION_MESSAGES as MESSAGES } from '../../src/shared/lib/person-validation/person-messages';
import {
  type AdminSession,
  nameToken,
  openAdminSession,
  uniquePhone,
} from '../support/admin/admin-users';
import {
  activeStaff,
  historyPanel,
  newClient,
  openCard,
  runAction,
} from '../support/admin/admin-user-card';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should check the data, refuse a taken phone and save the change', async () => {
  const { page, api } = session;
  const courier = await activeStaff(api, 'courier');
  const client = await newClient(api);
  await openCard(page, courier.userId);

  const dialog = await runAction(page, 'Изменить данные', DIALOG.EDIT_TITLE);
  await expect(dialog.getByLabel(DIALOG.EMAIL, { exact: true })).toBeDisabled();
  await expect(dialog.getByLabel(DIALOG.EMAIL, { exact: true })).toHaveValue(courier.email);
  await expect(dialog.getByText(DIALOG.EMAIL_HINT)).toBeVisible();
  const firstName = dialog.getByLabel(DIALOG.FIRST_NAME, { exact: true });
  const phone = dialog.getByLabel(DIALOG.PHONE, { exact: true });

  await firstName.fill('');
  await phone.fill('12');
  await dialog.getByRole('button', { name: DIALOG.EDIT_CONFIRM }).click();
  await expect(dialog.getByText(MESSAGES.FIRST_NAME_REQUIRED)).toBeVisible();
  await expect(dialog.getByText(MESSAGES.PHONE_INVALID)).toBeVisible();

  const newName = nameToken();
  await firstName.fill(newName);
  await phone.fill(client.phone);
  await dialog.getByRole('button', { name: DIALOG.EDIT_CONFIRM }).click();
  await expect(
    dialog.getByText('Пользователь с таким телефоном уже зарегистрирован'),
  ).toBeVisible();
  await expect(dialog).toBeVisible();

  await phone.fill(uniquePhone());
  await dialog.getByRole('button', { name: DIALOG.EDIT_CONFIRM }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${newName} Петров`);
  await expect(historyPanel(page)).toContainText('Изменены данные');
  await expect(historyPanel(page)).toContainText('Имя, телефон');
  await expect(page.getByRole('region', { name: TEXTS.CONTACTS })).toContainText('+375 33');
});
