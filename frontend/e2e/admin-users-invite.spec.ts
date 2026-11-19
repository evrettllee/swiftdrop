import { expect, type Page, test } from '@playwright/test';
import { ADMIN_USERS_TEXTS as TEXTS } from '../src/pages/admin-users/config/texts';
import { INVITE_STAFF_TEXTS as INVITE } from '../src/pages/admin-users/config/invite-texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { paceAdminWrite } from './support/admin-pace';
import {
  type AdminSession,
  openAdminSession,
  staffSeed,
  type StaffSeed,
  usersRows,
} from './support/admin-users';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
let courier: StaffSeed;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
  courier = staffSeed('courier', 'Приглашённый', `invite-${Date.now()}@swiftdrop.test`);
});

test.afterAll(async () => {
  await session.context.close();
});

function inviteDialog(page: Page) {
  return page.getByRole('dialog', { name: INVITE.TITLE });
}

async function fillInvite(page: Page, seed: StaffSeed): Promise<void> {
  const dialog = inviteDialog(page);
  const card = seed.role === 'courier' ? INVITE.COURIER : INVITE.MANAGER;
  await dialog
    .locator('label')
    .filter({ hasText: new RegExp(`^${card}`) })
    .click();
  await expect(dialog.getByRole('radio', { name: new RegExp(card) })).toBeChecked();
  await dialog.getByLabel(INVITE.FIRST_NAME, { exact: true }).fill(seed.firstName);
  await dialog.getByLabel(INVITE.LAST_NAME, { exact: true }).fill(seed.lastName);
  await dialog.getByLabel(INVITE.EMAIL, { exact: true }).fill(seed.email);
  await dialog.getByLabel(INVITE.PHONE, { exact: true }).fill(seed.phone);
}

async function openInvite(page: Page): Promise<void> {
  await page.getByRole('button', { name: TEXTS.ADD_STAFF }).first().click();
  await expect(inviteDialog(page)).toBeVisible();
}

test('should check the fields before sending', async () => {
  const { page } = session;
  await page.goto(APP_ROUTES.ADMIN_USERS);
  await openInvite(page);

  await inviteDialog(page).getByRole('button', { name: INVITE.SUBMIT }).click();

  await expect(inviteDialog(page).getByText('Введите имя')).toBeVisible();
  await expect(inviteDialog(page).getByText('Введите email')).toBeVisible();
  await expect(inviteDialog(page).getByText('Введите телефон')).toBeVisible();
});

test('should invite a courier, copy the link and open the couriers with them', async () => {
  const { page } = session;
  await page.goto(APP_ROUTES.ADMIN_USERS);
  await openInvite(page);
  await fillInvite(page, courier);
  await paceAdminWrite();

  await inviteDialog(page).getByRole('button', { name: INVITE.SUBMIT }).click();

  const done = page.getByRole('dialog', { name: INVITE.SENT_TITLE });
  await expect(done).toContainText(`${courier.firstName} ${courier.lastName} добавлен как курьер`);
  await expect(done).toContainText(courier.email);
  await expect(done).toContainText('ссылка действует 72 часа');
  await done.getByRole('button', { name: INVITE.COPY }).click();
  await expect(done.getByRole('button', { name: INVITE.COPIED })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /\/set-password\/[\w-]{43}$/,
  );

  await done.getByRole('button', { name: INVITE.DONE }).click();

  await expect(page).toHaveURL(/role=courier/);
  await expect(usersRows(page).first()).toContainText(courier.email);
});

test('should open the managers after inviting a manager', async () => {
  const { page } = session;
  const manager = staffSeed('manager', 'Новенькая', `invite-m-${Date.now()}@swiftdrop.test`);
  await page.goto(APP_ROUTES.ADMIN_USERS);
  await openInvite(page);
  await fillInvite(page, manager);
  await paceAdminWrite();
  await inviteDialog(page).getByRole('button', { name: INVITE.SUBMIT }).click();

  await page.getByRole('button', { name: INVITE.DONE }).click();

  await expect(page).toHaveURL(/role=manager/);
  await expect(usersRows(page).first()).toContainText(manager.email);
});

test('should show a taken email under Email and a taken phone under Телефон', async () => {
  const { page } = session;
  await page.goto(APP_ROUTES.ADMIN_USERS);
  await openInvite(page);
  await fillInvite(page, { ...courier, phone: staffSeed('courier', 'А', 'a@b.c').phone });
  await paceAdminWrite();
  await inviteDialog(page).getByRole('button', { name: INVITE.SUBMIT }).click();

  await expect(
    inviteDialog(page).getByLabel(INVITE.EMAIL, { exact: true }),
  ).toHaveAccessibleDescription(/Пользователь с таким email уже зарегистрирован/);

  await inviteDialog(page).getByLabel(INVITE.EMAIL, { exact: true }).fill(`other-${courier.email}`);
  await inviteDialog(page).getByLabel(INVITE.PHONE, { exact: true }).fill(courier.phone);
  await paceAdminWrite();
  await inviteDialog(page).getByRole('button', { name: INVITE.SUBMIT }).click();

  await expect(
    inviteDialog(page).getByLabel(INVITE.PHONE, { exact: true }),
  ).toHaveAccessibleDescription(/Пользователь с таким телефоном уже зарегистрирован/);
});

test('should warn when the letter was not sent', async () => {
  const { page } = session;
  await page.route('**/api/admin/staff', (route) =>
    route.fulfill({
      json: {
        userId: 990100,
        email: 'unsent@swiftdrop.test',
        setPasswordUrl: 'http://localhost:5174/set-password/x',
        expiresAt: new Date(Date.now() + 72 * 3_600_000).toISOString(),
        emailSent: false,
      },
    }),
  );
  await page.goto(APP_ROUTES.ADMIN_USERS);
  await openInvite(page);
  await fillInvite(page, staffSeed('courier', 'Безписьма', 'unsent@swiftdrop.test'));
  await inviteDialog(page).getByRole('button', { name: INVITE.SUBMIT }).click();

  const created = page.getByRole('dialog', { name: INVITE.CREATED_TITLE });
  await expect(created.getByRole('alert').or(created.getByRole('status'))).toContainText(
    INVITE.NOT_SENT,
  );
  await expect(created.getByText(INVITE.FALLBACK_TITLE)).toBeVisible();
  await page.unroute('**/api/admin/staff');
});
