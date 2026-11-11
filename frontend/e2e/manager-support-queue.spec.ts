import { expect, test } from '@playwright/test';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { managerMenu } from './support/manager';
import { stubSupport, SUPPORT_PATH, ticketsOf } from './support/manager-support';

test('should count the tabs and keep them with the menu badge after a ticket event', async ({
  page,
}) => {
  const stub = await stubSupport(page);
  await page.goto(SUPPORT_PATH);

  const tabs = page.getByRole('tablist', { name: 'Обращения' });
  await expect(tabs.getByRole('tab')).toHaveText(['Без ответа2', 'Открытые2', 'Закрытые1']);
  const list = page.getByRole('list', { name: 'Очередь обращений' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('listitem').first()).toContainText('Анна Кравец');
  await expect(list.getByText('ждёт 18 мин')).toHaveClass(/hidden lg:inline/);
  await expect(page.getByText('Выберите обращение')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveValue('lastMessageAt:asc');

  stub.counts.awaiting = 1;
  stub.tickets[1].awaitingStaff = false;
  stub.socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: 92,
    kind: 'message',
    awaitingStaff: false,
    status: 'open',
  });
  await expect(tabs.getByRole('tab').first()).toHaveText('Без ответа1');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(managerMenu(page).getByRole('link', { name: /Поддержка/ })).toContainText('1');
});

test('should keep the chips, the search, the sort and the tab in the address', async ({ page }) => {
  const stub = await stubSupport(page);
  await page.goto(SUPPORT_PATH);
  const list = page.getByRole('list', { name: 'Очередь обращений' });
  await expect(list.getByRole('listitem')).toHaveCount(2);

  await page.getByRole('button', { name: 'Курьеры' }).click();
  await expect(page).toHaveURL(`${SUPPORT_PATH}?role=courier`);
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect.poll(() => ticketsOf(stub, 'awaiting').at(-1)?.get('authorRole')).toBe('courier');

  await page.getByRole('searchbox', { name: 'Поиск обращений' }).fill('Анна');
  await expect(page).toHaveURL(`${SUPPORT_PATH}?role=courier&q=%D0%90%D0%BD%D0%BD%D0%B0`);
  await expect(page.getByRole('heading', { name: 'Ничего не найдено' })).toBeVisible();
  await expect(page.getByText('По запросу «Анна» обращений нет.')).toBeVisible();

  await page.getByRole('button', { name: 'Все' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Сортировка' }).selectOption('lastMessageAt:desc');
  await expect(page).toHaveURL(/sort=lastMessageAt%3Adesc/);
  await expect
    .poll(() => ticketsOf(stub, 'awaiting').at(-1)?.get('sort'))
    .toBe('lastMessageAt:desc');

  await page.getByRole('tab', { name: /Закрытые/ }).click();
  await expect(page).toHaveURL(/view=closed/);
  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveValue(
    'lastMessageAt:desc',
  );
});

test('should say that every ticket is answered when the queue is empty', async ({ page }) => {
  const stub = await stubSupport(page);
  stub.tickets = stub.tickets.filter((item) => item.status === 'closed');
  await page.goto(SUPPORT_PATH);

  await expect(page.getByRole('heading', { name: 'Все обращения отвечены' })).toBeVisible();
});

test('should offer the four sorts of the queue and sort by the creation time', async ({ page }) => {
  const stub = await stubSupport(page);
  await page.goto(SUPPORT_PATH);
  const sort = page.getByRole('combobox', { name: 'Сортировка' });

  await expect(sort.getByRole('option')).toHaveText([
    'Дольше без ответа',
    'Недавние сообщения',
    'Новые обращения',
    'Старые обращения',
  ]);
  await sort.selectOption('Старые обращения');

  await expect(page).toHaveURL(/sort=createdAt%3Aasc/);
  await expect.poll(() => ticketsOf(stub, 'awaiting').at(-1)?.get('sort')).toBe('createdAt:asc');
});
