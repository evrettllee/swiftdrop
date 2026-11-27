import { expect, test } from '@playwright/test';
import { ADMIN_USERS_TEXTS as TEXTS } from '../../src/pages/admin/users/config/texts';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';
import {
  type AdminSession,
  inviteVia,
  nameToken,
  openAdminSession,
  staffSeed,
  type StaffSeed,
  usersRows,
} from '../support/admin/admin-users';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
let seed: StaffSeed;
let userId: number;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
  const token = nameToken();
  seed = staffSeed('courier', `Поиск${token.toLowerCase()}`, `find-${Date.now()}@swiftdrop.test`);
  userId = await inviteVia(session.api, seed);
});

test.afterAll(async () => {
  await session.context.close();
});

async function searchFor(text: string): Promise<void> {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);
  await page.getByRole('searchbox', { name: TEXTS.SEARCH_LABEL }).fill(text);
  await expect(page).toHaveURL(/q=/);
}

test('should find a courier by a part of the name', async () => {
  await searchFor(seed.lastName.slice(0, 9));

  await expect(usersRows(session.page)).toHaveCount(1);
  await expect(usersRows(session.page)).toContainText(seed.email);
  await expect(usersRows(session.page)).toContainText('Приглашён');
});

test('should find a courier by a part of the email', async () => {
  await searchFor(seed.email.split('@')[0].slice(2));

  await expect(usersRows(session.page)).toHaveCount(1);
  await expect(usersRows(session.page)).toContainText(seed.email);
});

test('should find a courier by the phone and lead the row to the card', async () => {
  await searchFor(seed.phone);

  await expect(usersRows(session.page)).toHaveCount(1);
  await expect(
    usersRows(session.page).getByRole('link', { name: `${seed.firstName} ${seed.lastName}` }),
  ).toHaveAttribute('href', new RegExp(`^${APP_ROUTES.ADMIN_USERS}/${userId}\\?role=courier&q=`));
});

test('should keep the search in the URL after a reload', async () => {
  await searchFor(seed.email);
  await session.page.reload();

  await expect(session.page.getByRole('searchbox', { name: TEXTS.SEARCH_LABEL })).toHaveValue(
    seed.email,
  );
  await expect(usersRows(session.page)).toHaveCount(1);
});
