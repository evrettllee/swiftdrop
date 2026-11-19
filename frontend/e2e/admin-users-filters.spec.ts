import { expect, type Page, test } from '@playwright/test';
import { ADMIN_USERS_TEXTS as TEXTS } from '../src/pages/admin-users/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  type AdminSession,
  deleteVia,
  inviteVia,
  listVia,
  openAdminSession,
  staffSeed,
  type StaffSeed,
  usersRows,
} from './support/admin-users';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;
let deleted: StaffSeed;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
  deleted = staffSeed('courier', 'Удалёнов', `gone-${Date.now()}@swiftdrop.test`);
  await deleteVia(session.api, await inviteVia(session.api, deleted));
  await inviteVia(
    session.api,
    staffSeed('courier', 'Безмашинный', `walk-${Date.now()}@swiftdrop.test`),
  );
});

test.afterAll(async () => {
  await session.context.close();
});

function panelApply(page: Page) {
  return page.getByRole('button', { name: /^Показать/ });
}

test('should show the deleted couriers only with the deleted status chosen', async () => {
  const { page, api } = session;
  const gone = await listVia(api, { role: 'courier', status: 'deleted' });
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);
  await expect(usersRows(page).first()).toBeVisible();
  await expect(usersRows(page).filter({ hasText: 'Удалён' })).toHaveCount(0);

  await page.getByRole('button', { name: TEXTS.FILTERS }).click();
  for (const name of ['Активные', 'Приглашённые', 'Заблокированные']) {
    await page.getByRole('checkbox', { name }).uncheck({ force: true });
  }
  await page.getByRole('checkbox', { name: 'Удалённые' }).check({ force: true });

  await expect(panelApply(page)).toHaveText(new RegExp(`^Показать ${gone.total} курьер`));
  await panelApply(page).click();

  await expect(usersRows(page)).toHaveCount(gone.total);
  for (const row of await usersRows(page).all()) {
    await expect(row).toContainText('Удалён');
  }
  await expect(page.getByRole('button', { name: /Статус: Удалённые/ })).toBeVisible();
  await expect(page).toHaveURL(/status=deleted/);
});

test('should filter the couriers by a vehicle with the count of the API', async () => {
  const { page, api } = session;
  const cars = await listVia(api, { role: 'courier', vehicle: 'car' });
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);

  await page.getByRole('button', { name: TEXTS.FILTERS }).click();
  await page.getByRole('button', { name: 'Легковой', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Легковой', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(panelApply(page)).toHaveText(new RegExp(`Показать ${cars.total} `));
  await panelApply(page).click();

  await expect(usersRows(page)).toHaveCount(cars.total);
  for (const row of await usersRows(page).all()) {
    await expect(row).toContainText('Легковой');
  }
  await expect(page.getByRole('button', { name: /Транспорт: Легковой/ })).toBeVisible();
});

test('should find the couriers without a vehicle and reset the panel to the defaults', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier&vehicle=none`);

  await expect(usersRows(page).first()).toContainText('Не указан');
  await page.getByRole('button', { name: /Фильтры/ }).click();
  await page.getByRole('button', { name: TEXTS.RESET, exact: true }).click();

  await expect(page.getByRole('button', { name: 'Не указан', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('checkbox', { name: 'Удалённые' })).not.toBeChecked();
  await panelApply(page).click();

  await expect(page).not.toHaveURL(/vehicle=/);
  await expect(page.getByRole('group', { name: TEXTS.APPLIED_FILTERS })).toHaveCount(0);
});

test('should refuse to apply the filters without any status', async () => {
  const { page } = session;
  await page.goto(`${APP_ROUTES.ADMIN_USERS}?role=courier`);
  await page.getByRole('button', { name: /Фильтры/ }).click();

  for (const name of ['Активные', 'Приглашённые', 'Заблокированные']) {
    await page.getByRole('checkbox', { name }).uncheck({ force: true });
  }

  await expect(panelApply(page)).toBeDisabled();
});
