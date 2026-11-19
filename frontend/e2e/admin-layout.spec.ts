import { expect, test } from '@playwright/test';
import { ADMIN_LAYOUT_TEXTS } from '../src/app/layouts/staff-layout/admin-navigation';
import { AUTH_TEXTS } from '../src/pages/auth/config/texts';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { adminMenu, openAsAdmin, stubAdminUsersApi } from './support/admin';
import { stubAppSocket } from './support/app-socket';

const SECTIONS = [
  { name: 'Пользователи', path: APP_ROUTES.ADMIN_USERS },
  { name: 'Тарифы', path: APP_ROUTES.ADMIN_TARIFFS },
  { name: 'Аналитика', path: APP_ROUTES.ADMIN_ANALYTICS },
];

test('should send an admin to the users when a session is found on the sign-in page', async ({
  page,
}) => {
  await openAsAdmin(page);

  await page.goto(APP_ROUTES.AUTH);

  await expect(page).toHaveURL(APP_ROUTES.ADMIN_USERS);
  await expect(page.getByRole('heading', { level: 1, name: 'Пользователи' })).toBeVisible();
});

test('should send an admin to the users after signing in with a password', async ({ page }) => {
  await stubAppSocket(page);
  await stubAdminUsersApi(page);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
  );
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, (route) =>
    route.fulfill({
      json: {
        user: {
          userId: 990009,
          firstName: 'Андрей',
          lastName: 'Ковалёв',
          email: 'admin@example.com',
          phone: null,
          role: ROLE.ADMIN,
        },
      },
    }),
  );
  await page.goto(APP_ROUTES.AUTH);

  await page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true }).fill('admin@example.com');
  await page.getByLabel(AUTH_TEXTS.LABEL_PASSWORD, { exact: true }).fill('Password123');
  await page.getByRole('button', { name: AUTH_TEXTS.SUBMIT_LOGIN, exact: true }).click();

  await expect(page).toHaveURL(APP_ROUTES.ADMIN_USERS);
  await expect(page.getByRole('heading', { level: 1, name: 'Пользователи' })).toBeVisible();
});

test('should redirect /admin to the users', async ({ page }) => {
  await openAsAdmin(page);

  await page.goto(APP_ROUTES.ADMIN);

  await expect(page).toHaveURL(APP_ROUTES.ADMIN_USERS);
});

test('should show the three items and the profile block in the admin sidebar', async ({ page }) => {
  await openAsAdmin(page);
  await page.goto(APP_ROUTES.ADMIN_USERS);

  const menu = adminMenu(page);
  await expect(menu.getByRole('link')).toHaveText(['Пользователи', 'Тарифы', 'Аналитика']);
  await expect(menu.getByRole('link', { name: 'Пользователи' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const profile = page.getByRole('link', { name: `Анна Тестова ${ADMIN_LAYOUT_TEXTS.ROLE}` });
  await expect(profile).toBeVisible();

  await profile.click();

  await expect(page).toHaveURL(APP_ROUTES.ADMIN_PROFILE);
  await expect(page.getByRole('heading', { level: 1, name: 'Профиль' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
});

test('should sign an admin out from the profile page', async ({ page }) => {
  await openAsAdmin(page);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.LOGOUT}`, (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto(APP_ROUTES.ADMIN_PROFILE);

  await page.getByRole('button', { name: 'Выйти' }).click();

  await expect(page).toHaveURL(new RegExp(APP_ROUTES.AUTH));
  await expect(page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true })).toBeVisible();
});

test('should move between the sections of the admin', async ({ page }) => {
  await openAsAdmin(page);
  await page.goto(APP_ROUTES.ADMIN_USERS);

  for (const { name, path } of SECTIONS) {
    await adminMenu(page).getByRole('link', { name, exact: true }).click();

    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
    await expect(adminMenu(page).getByRole('link', { name, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 844 } });

  test('should show four items in the bottom navigation of the admin', async ({ page }) => {
    await openAsAdmin(page);
    await page.goto(APP_ROUTES.ADMIN_USERS);

    const bottom = adminMenu(page);
    await expect(bottom.getByRole('link')).toHaveText([
      'Пользователи',
      'Тарифы',
      'Аналитика',
      'Профиль',
    ]);
    await expect(bottom.getByRole('button')).toHaveCount(0);

    await bottom.getByRole('link', { name: 'Профиль' }).click();

    await expect(page).toHaveURL(APP_ROUTES.ADMIN_PROFILE);
    await expect(bottom.getByRole('link', { name: 'Профиль' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
