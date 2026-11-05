import { expect, type Page, test } from '@playwright/test';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { closedTickets } from './support/author-support-fixtures';
import { stubAuthorSupport } from './support/author-support';

function cards(page: Page) {
  return page.getByRole('list', { name: 'Мои обращения' }).getByRole('listitem');
}

test('should list the open tickets of the client with their state and count both tabs', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  await page.goto(APP_ROUTES.SUPPORT);

  const tabs = page.getByRole('tablist', { name: 'Обращения' });
  await expect(tabs.getByRole('tab')).toHaveText(['Открытые2', 'Закрытые2']);
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).first()).toContainText('Курьер не может найти подъезд');
  await expect(cards(page).first()).toContainText(
    'Заказ №48232, поддержка: Сейчас передам курьеру',
  );
  await expect(cards(page).first()).toContainText('Есть ответ');
  await expect(cards(page).nth(1)).toContainText('вы: Второй час на линии');
  await expect(cards(page).nth(1)).toContainText('Ждёт ответа');
  await expect(cards(page).first().getByRole('link')).toHaveAttribute('href', '/support/91');
  expect(stub.listRequests.map((search) => [search.get('status'), search.get('limit')])).toEqual(
    expect.arrayContaining([
      ['open', '20'],
      ['closed', '1'],
    ]),
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Личный кабинет' })
      .getByRole('link', { name: 'Поддержка' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('should load the next closed tickets by the cursor', async ({ page }) => {
  const stub = await stubAuthorSupport(page);
  stub.tickets = [
    ...stub.tickets.filter((item) => item.status === 'open'),
    ...closedTickets(23, 300),
  ];
  await page.goto(`${APP_ROUTES.SUPPORT}?status=closed`);

  await expect(page.getByRole('tab', { name: /Закрытые/ })).toHaveText('Закрытые23');
  await expect(cards(page)).toHaveCount(20);
  await expect(cards(page).first()).toContainText('Закрыто');
  await page.getByRole('button', { name: 'Показать ещё' }).click();
  await expect(cards(page)).toHaveCount(23);
  await expect(page.getByRole('button', { name: 'Показать ещё' })).toHaveCount(0);
  expect(stub.listRequests.at(-1)?.get('cursor')).toBe('20');
});

test('should offer a new ticket when there are no open tickets and not when nothing is closed', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  stub.tickets = [];
  await page.goto(APP_ROUTES.SUPPORT);

  const empty = page.getByRole('tabpanel');
  await expect(empty.getByRole('heading', { name: 'Обращений пока нет' })).toBeVisible();
  await expect(empty.getByRole('button', { name: 'Новое обращение' })).toBeVisible();

  await page.getByRole('tab', { name: /Закрытые/ }).click();
  await expect(page).toHaveURL(/status=closed/);
  await expect(empty.getByRole('heading', { name: 'Обращений пока нет' })).toBeVisible();
  await expect(empty.getByRole('button', { name: 'Новое обращение' })).toHaveCount(0);
});

test('should reach the support of the client from the profile on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await stubAuthorSupport(page);
  await page.goto(APP_ROUTES.PROFILE);

  await page.getByRole('link', { name: 'Поддержка' }).click();
  await expect(page).toHaveURL(APP_ROUTES.SUPPORT);
  await expect(cards(page)).toHaveCount(2);
  await expect(
    page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Профиль' }),
  ).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await page.getByRole('link', { name: 'Профиль' }).first().click();
  await expect(page).toHaveURL(APP_ROUTES.PROFILE);
});

test('should give the courier their own support and keep the pages of each role apart', async ({
  page,
}) => {
  await stubAuthorSupport(page, ROLE.COURIER);
  await page.goto(APP_ROUTES.COURIER_SUPPORT);

  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).first().getByRole('link')).toHaveAttribute(
    'href',
    '/courier/support/91',
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Основная навигация' })
      .getByRole('link', { name: 'Поддержка' }),
  ).toHaveAttribute('aria-current', 'page');

  await page.goto(APP_ROUTES.SUPPORT);
  await expect(page.getByRole('heading', { name: 'Нет доступа' })).toBeVisible();
  await page.goto('/support/91');
  await expect(page.getByRole('heading', { name: 'Нет доступа' })).toBeVisible();
});

test('should not let the client open the support of the courier', async ({ page }) => {
  await stubAuthorSupport(page);

  await page.goto(APP_ROUTES.COURIER_SUPPORT);
  await expect(page.getByRole('heading', { name: 'Нет доступа' })).toBeVisible();
  await page.goto('/courier/support/91');
  await expect(page.getByRole('heading', { name: 'Нет доступа' })).toBeVisible();
});
