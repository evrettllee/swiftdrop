import { expect, test } from '@playwright/test';
import { USER_CARD_TEXTS as TEXTS } from '../../src/pages/admin/user-card/config/texts';
import { type AdminSession, openAdminSession } from '../support/admin/admin-users';
import {
  activeStaff,
  historyPanel,
  managePanel,
  newClient,
  openCard,
} from '../support/admin/admin-user-card';

test.describe.configure({ mode: 'serial' });

let session: AdminSession;

test.beforeAll(async ({ browser }) => {
  session = await openAdminSession(browser);
});

test.afterAll(async () => {
  await session.context.close();
});

test('should open a client from the list and go back to the same list', async () => {
  const { page, api } = session;
  const client = await newClient(api);
  const listSearch = new URLSearchParams({ role: 'client', q: client.email, sort: 'oldest' });
  await page.goto(`/admin/users?${listSearch.toString()}`);

  await page.getByRole('link', { name: `${client.firstName} ${client.lastName}` }).click();

  await expect(page).toHaveURL(new RegExp(`/admin/users/${client.userId}\\?`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    `${client.firstName} ${client.lastName}`,
  );
  await expect(page.getByText('Клиент', { exact: true })).toBeVisible();
  const contacts = page.getByRole('region', { name: TEXTS.CONTACTS });
  await expect(contacts).toContainText(client.email);
  await expect(contacts).toContainText('Пароль');
  await expect(page.getByRole('region', { name: TEXTS.ORDERS })).toContainText(TEXTS.NO_ORDERS);
  await expect(historyPanel(page)).toContainText(TEXTS.NO_HISTORY);
  await expect(managePanel(page).getByRole('button')).toHaveText([
    'Завершить все сеансы',
    'Заблокировать',
    'Удалить',
  ]);

  await page
    .getByRole('navigation', { name: TEXTS.BREADCRUMBS_LABEL })
    .getByRole('link', { name: 'Клиенты' })
    .click();

  await expect(page).toHaveURL(/\/admin\/users\?/);
  const back = new URL(page.url()).searchParams;
  expect(back.get('q')).toBe(client.email);
  expect(back.get('sort')).toBe('oldest');
  await expect(
    page.getByRole('link', { name: `${client.firstName} ${client.lastName}` }),
  ).toBeVisible();
});

test('should show what a courier does and who invited them', async () => {
  const { page, api } = session;
  const courier = await activeStaff(api, 'courier');

  await openCard(page, courier.userId);

  await expect(page.getByText('Курьер', { exact: true })).toBeVisible();
  const work = page.getByRole('region', { name: TEXTS.WORK });
  await expect(work).toContainText('Не указан');
  await expect(work).toContainText('0');
  await expect(work).toContainText('Не на линии');
  await expect(page.getByRole('region', { name: TEXTS.CONTACTS })).toContainText('Пароль');
  await expect(page.getByRole('region', { name: TEXTS.DELIVERIES })).toContainText(
    TEXTS.NO_DELIVERIES,
  );
  await expect(historyPanel(page)).toContainText('Приглашение отправлено');
  await expect(historyPanel(page)).toContainText('Роль: курьер');
  await expect(managePanel(page).getByRole('button')).toHaveText([
    'Изменить данные',
    'Сменить роль',
    'Сбросить пароль',
    'Завершить все сеансы',
    'Заблокировать',
    'Удалить',
  ]);
  await expect(
    page.getByRole('navigation', { name: TEXTS.BREADCRUMBS_LABEL }).getByRole('link', {
      name: 'Курьеры',
    }),
  ).toHaveAttribute('href', '/admin/users?role=courier');
});

test('should say an unknown user is not found', async () => {
  const { page } = session;

  for (const id of ['999999999', 'abc']) {
    await page.goto(`/admin/users/${id}`);

    await expect(page.getByRole('heading', { name: TEXTS.NOT_FOUND_TITLE })).toBeVisible();
    await expect(page.getByRole('link', { name: TEXTS.BACK_TO_USERS })).toHaveAttribute(
      'href',
      '/admin/users',
    );
  }
});
