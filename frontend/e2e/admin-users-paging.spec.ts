import { expect, test } from '@playwright/test';
import { ADMIN_USERS_TEXTS as TEXTS } from '../src/pages/admin-users/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  type AdminSession,
  inviteVia,
  listVia,
  nameToken,
  openAdminSession,
  staffSeed,
  usersRows,
} from './support/admin-users';

const PAGE_SIZE = 20;
const SEEDED = PAGE_SIZE + 1;
const FIRST_NAMES = ['Яна', 'Борис', 'Олег', 'Анна', 'Глеб', 'Вера', 'Эрик'];

test.describe.configure({ mode: 'serial', timeout: 180_000 });

let session: AdminSession;
let token: string;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  session = await openAdminSession(browser);
  token = `pg${Date.now()}`;
  const lastName = `Страничный${nameToken().toLowerCase()}`;

  for (let index = 0; index < SEEDED; index += 1) {
    await inviteVia(session.api, {
      ...staffSeed('manager', lastName, `${token}-${index}@swiftdrop.test`),
      firstName: FIRST_NAMES[index % FIRST_NAMES.length],
    });
  }
});

test.afterAll(async () => {
  await session.context.close();
});

test('should split more than 20 people into pages and keep the page in the URL', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=manager&q=${token}`);

  await expect(usersRows(page)).toHaveCount(PAGE_SIZE);
  await expect(page.getByText(`1–${PAGE_SIZE} из ${SEEDED}`)).toBeVisible();
  await expect(page.getByText('Страница 1 из 2')).toBeVisible();

  await page.getByRole('button', { name: 'Следующая страница' }).click();

  await expect(page).toHaveURL(/page=2/);
  await expect(usersRows(page)).toHaveCount(1);
  await expect(page.getByText(`${SEEDED}–${SEEDED} из ${SEEDED}`)).toBeVisible();
});

test('should sort by name as the API does', async () => {
  const { page, api } = session;
  const byName = await listVia(api, { role: 'manager', q: token, sort: 'name' });
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=manager&q=${token}`);

  await page.getByLabel(TEXTS.SORT).selectOption('name');

  await expect(page).toHaveURL(/sort=name/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(usersRows(page).first()).toContainText(byName.items[0].email);
  await expect(usersRows(page).nth(PAGE_SIZE - 1)).toContainText(byName.items[PAGE_SIZE - 1].email);
});

test('should turn the registration header into the oldest first', async () => {
  const { page, api } = session;
  const oldest = await listVia(api, { role: 'manager', q: token, sort: 'oldest' });
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=manager&q=${token}`);
  const header = page.getByRole('columnheader', { name: new RegExp(TEXTS.COLUMN_CREATED) });

  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await header.getByRole('button').click();

  await expect(page).toHaveURL(/sort=oldest/);
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(usersRows(page).first()).toContainText(oldest.items[0].email);
});
