import { expect, test } from '@playwright/test';
import { ADMIN_USERS_TEXTS as TEXTS } from '../src/pages/admin-users/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  type AdminSession,
  countsVia,
  deleteVia,
  listVia,
  openAdminSession,
} from './support/admin-users';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should show the counts of the API on the tabs', async () => {
  const { page, api } = session;
  await page.goto(APP_ROUTES.ADMIN_USERS);
  const counts = await countsVia(api);

  await expect(page.getByRole('tab', { name: new RegExp(TEXTS.TAB_CLIENTS) })).toContainText(
    String(counts.client),
  );
  await expect(page.getByRole('tab', { name: new RegExp(TEXTS.TAB_COURIERS) })).toContainText(
    String(counts.courier),
  );
  await expect(page.getByRole('tab', { name: new RegExp(TEXTS.TAB_MANAGERS) })).toContainText(
    String(counts.manager),
  );
});

test('should offer the only add button on an empty managers tab', async () => {
  const { page, api } = session;
  const managers = await listVia(api, { role: 'manager' });

  for (const manager of managers.items) {
    await deleteVia(api, manager.userId);
  }

  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=manager`);

  await expect(page.getByRole('heading', { name: TEXTS.EMPTY_MANAGERS })).toBeVisible();
  await expect(page.getByText(TEXTS.EMPTY_STAFF_TEXT)).toBeVisible();
  await expect(page.getByRole('button', { name: TEXTS.ADD_STAFF })).toHaveCount(1);
  await expect(page.getByRole('searchbox', { name: TEXTS.SEARCH_LABEL })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: new RegExp(TEXTS.TAB_MANAGERS) })).toContainText('0');
});

test('should show nobody found without a button and reset through the chips', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);
  const search = page.getByRole('searchbox', { name: TEXTS.SEARCH_LABEL });

  await search.fill('Никтотакойнеживёт');

  await expect(page.getByRole('heading', { name: TEXTS.EMPTY_SEARCH_TITLE })).toBeVisible();
  await expect(page).toHaveURL(/q=/);
  const chips = page.getByRole('group', { name: TEXTS.APPLIED_FILTERS });
  await expect(chips.getByRole('button', { name: /Поиск/ })).toBeVisible();
  await expect(page.getByRole('main').getByRole('button', { name: TEXTS.ADD_STAFF })).toHaveCount(
    1,
  );

  await chips.getByRole('button', { name: TEXTS.RESET_ALL }).click();

  await expect(search).toHaveValue('');
  await expect(page.getByRole('heading', { name: TEXTS.EMPTY_SEARCH_TITLE })).toBeHidden();
  await expect(page).not.toHaveURL(/q=/);
});
