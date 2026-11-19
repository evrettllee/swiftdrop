import { type APIRequestContext, expect, test } from '@playwright/test';
import { PASSWORD_MESSAGES } from '../src/features/password-fields/config/password-rules';
import { AUTH_ERROR_MESSAGES } from '../src/pages/auth/config/auth-page';
import { SET_PASSWORD_TEXTS } from '../src/pages/set-password/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  expectNoOverflow,
  fillPasswords,
  inviteStaff,
  loginStatus,
  openSetPassword,
  resetPassword,
  setPasswordThroughApi,
  signInStandAdmin,
  STAND_PASSWORD,
  WEAK_PASSWORD,
} from './support/set-password';

const UNKNOWN_TOKEN = 'A'.repeat(43);
const PHONE = { width: 375, height: 812 };

test.describe.configure({ mode: 'serial', timeout: 120_000 });

let admin: APIRequestContext;

test.beforeAll(async () => {
  admin = await signInStandAdmin();
});

test.afterAll(async () => {
  await admin.dispose();
});

test('should check an invited courier and send them to the courier home', async ({ page }) => {
  const { token, email } = await inviteStaff(admin, 'courier');
  let posted = 0;
  await page.route(`**/api/auth/password-links/${token}`, (route) => {
    posted += route.request().method() === 'POST' ? 1 : 0;

    return route.continue();
  });
  await openSetPassword(page, token);
  const submit = page.getByRole('button', { name: SET_PASSWORD_TEXTS.SUBMIT });

  await expect(page.getByRole('heading', { level: 1, name: 'Создайте пароль' })).toBeVisible();
  await expect(
    page.getByText('Иван, вас пригласили в SwiftDrop как курьера. Придумайте пароль, чтобы войти.'),
  ).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await fillPasswords(page, WEAK_PASSWORD);
  await submit.click();
  await expect(page.getByText(PASSWORD_MESSAGES.WEAK)).toBeVisible();
  await fillPasswords(page, STAND_PASSWORD, `${STAND_PASSWORD}x`);
  await submit.click();
  await expect(page.getByText(PASSWORD_MESSAGES.MISMATCH)).toBeVisible();
  expect(posted).toBe(0);

  await page.setViewportSize(PHONE);
  await expectNoOverflow(page);
  await fillPasswords(page, STAND_PASSWORD);
  await submit.click();

  await expect(page).toHaveURL(APP_ROUTES.COURIER_WORK);
});

test('should send an invited manager to the manager home', async ({ page }) => {
  const { token } = await inviteStaff(admin, 'manager', 'Ольга');
  await openSetPassword(page, token);

  await expect(page.getByText(/Ольга, вас пригласили в SwiftDrop как менеджера/)).toBeVisible();
  await fillPasswords(page, STAND_PASSWORD);
  await page.getByRole('button', { name: SET_PASSWORD_TEXTS.SUBMIT }).click();

  await expect(page).toHaveURL(APP_ROUTES.MANAGER_ORDERS);
});

test('should show the invalid link screen for a used link and lead to sign-in', async ({
  page,
}) => {
  const { token } = await inviteStaff(admin, 'courier');
  await setPasswordThroughApi(token, STAND_PASSWORD);
  await page.setViewportSize(PHONE);

  await openSetPassword(page, token);

  await expect(
    page.getByRole('heading', { level: 1, name: SET_PASSWORD_TEXTS.INVALID_TITLE }),
  ).toBeVisible();
  await expect(page.getByText(SET_PASSWORD_TEXTS.INVALID_TEXT)).toBeVisible();
  await expectNoOverflow(page);

  await page.getByRole('link', { name: SET_PASSWORD_TEXTS.INVALID_ACTION }).click();

  await expect(page).toHaveURL(APP_ROUTES.AUTH);
});

test('should show the invalid link screen for an unknown token', async ({ page }) => {
  await openSetPassword(page, UNKNOWN_TOKEN);

  await expect(
    page.getByRole('heading', { level: 1, name: SET_PASSWORD_TEXTS.INVALID_TITLE }),
  ).toBeVisible();
});

test('should switch to the invalid screen when the link is used meanwhile', async ({ page }) => {
  const { token } = await inviteStaff(admin, 'courier');
  await openSetPassword(page, token);
  const submit = page.getByRole('button', { name: SET_PASSWORD_TEXTS.SUBMIT });
  await expect(submit).toBeVisible();
  await setPasswordThroughApi(token, STAND_PASSWORD);

  await fillPasswords(page, STAND_PASSWORD);
  await submit.click();

  await expect(
    page.getByRole('heading', { level: 1, name: SET_PASSWORD_TEXTS.INVALID_TITLE }),
  ).toBeVisible();
});

test('should set a new password from a reset link and drop the old one', async ({ page }) => {
  const invited = await inviteStaff(admin, 'courier');
  await setPasswordThroughApi(invited.token, STAND_PASSWORD);
  const reset = await resetPassword(admin, invited.userId);
  const newPassword = `${STAND_PASSWORD}-new`;
  await openSetPassword(page, reset.token);

  await expect(
    page.getByText('Иван, администратор сбросил ваш пароль. Придумайте новый пароль для входа.'),
  ).toBeVisible();
  await fillPasswords(page, newPassword);
  await page.getByRole('button', { name: SET_PASSWORD_TEXTS.SUBMIT }).click();

  await expect(page).toHaveURL(APP_ROUTES.COURIER_WORK);
  expect(await loginStatus(invited.email, STAND_PASSWORD)).toBe(401);
  expect(await loginStatus(invited.email, newPassword)).toBe(200);
});

test('should tell on the sign-in page that an invited member must create a password', async ({
  page,
}) => {
  await page.goto(`${APP_ROUTES.AUTH}?error=invite_pending`);

  await expect(page.getByRole('alert')).toHaveText(new RegExp(AUTH_ERROR_MESSAGES.invite_pending));
});
