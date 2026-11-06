import { expect, type Page, test } from '@playwright/test';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { stubSupport, SUPPORT_PATH } from './support/manager-support';
import { fromFixedNow } from './support/clock';

function reply(page: Page) {
  return page.getByRole('textbox', { name: 'Ответ клиенту' });
}

function pushMessage(stub: Awaited<ReturnType<typeof stubSupport>>, id: number, text: string) {
  stub.socket.push(SOCKET_EVENTS.SUPPORT_MESSAGE, {
    ticketId: 91,
    message: {
      id,
      text,
      createdAt: fromFixedNow(0).toISOString(),
      fromStaff: false,
      authorName: 'Анна Кравец',
      isRead: false,
    },
  });
}

test('should send a reply by Enter and explain each failure', async ({ page }) => {
  const stub = await stubSupport(page);
  await page.goto(`${SUPPORT_PATH}?ticket=91`);
  const log = page.getByRole('log', { name: 'Переписка' });
  await expect(log.getByText('Он уже 5 минут ищет')).toBeVisible();

  await reply(page).fill('Сейчас передам курьеру');
  await reply(page).press('Enter');
  await expect(log.getByText('Сейчас передам курьеру')).toBeVisible();
  await expect(reply(page)).toHaveValue('');
  expect(stub.sent).toEqual(['Сейчас передам курьеру']);

  stub.sendFailure = {
    status: 429,
    body: { message: 'Слишком много сообщений. Подождите минуту' },
  };
  await reply(page).fill('Ещё раз');
  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByText('Слишком много сообщений, подождите минуту')).toBeVisible();
  await expect(reply(page)).toHaveValue('Ещё раз');

  stub.sendFailure = 'network';
  await page.getByRole('button', { name: 'Отправить' }).click();
  await expect(page.getByText('Не отправлено.')).toBeVisible();
  stub.sendFailure = null;
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(log.getByText('Ещё раз')).toBeVisible();
  await expect(reply(page)).toHaveValue('');

  stub.sendFailure = { status: 409, body: { code: 'TICKET_CLOSED', message: 'Обращение закрыто' } };
  stub.tickets[0].status = 'closed';
  stub.tickets[0].closedAt = fromFixedNow(0).toISOString();
  const asked = stub.detailRequests;
  await reply(page).fill('Последнее');
  await reply(page).press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'Обращение уже закрыто' })).toBeVisible();
  expect(stub.detailRequests).toBeGreaterThan(asked);
  await expect(reply(page)).toHaveCount(0);
});

test('should add live messages once, mark own ones read and reread a closed ticket', async ({
  page,
}) => {
  const stub = await stubSupport(page);
  await page.goto(`${SUPPORT_PATH}?ticket=91`);
  const log = page.getByRole('log', { name: 'Переписка' });
  await expect(log.getByText('Он уже 5 минут ищет')).toBeVisible();
  await expect.poll(() => stub.reads.length).toBe(1);
  await reply(page).fill('Уточняю');
  await reply(page).press('Enter');
  await expect(log.getByRole('img', { name: 'Отправлено' })).toHaveCount(1);

  pushMessage(stub, 500, 'Спасибо, жду');
  pushMessage(stub, 500, 'Спасибо, жду');
  await expect(log.getByText('Спасибо, жду')).toHaveCount(1);
  await expect.poll(() => stub.reads.length).toBe(2);

  stub.socket.push(SOCKET_EVENTS.SUPPORT_READ, { ticketId: 91, by: 'author' });
  await expect(log.getByRole('img', { name: 'Отправлено' })).toHaveCount(0);
  await expect(log.getByRole('img', { name: 'Прочитано' })).toHaveCount(1);

  stub.tickets[0].status = 'closed';
  stub.tickets[0].closedAt = fromFixedNow(0).toISOString();
  stub.tickets[0].closedBy = { role: 'author', name: 'Анна Кравец' };
  stub.socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: 91,
    kind: 'closed',
    awaitingStaff: false,
    status: 'closed',
  });
  await expect(page.getByText(/^Обращение закрыто .* · Анна Кравец$/)).toBeVisible();
});

test('should keep a refused ticket read only', async ({ page }) => {
  const stub = await stubSupport(page);
  stub.socket.ticketAnswer = { ok: false, reason: 'not_found' };
  await page.goto(`${SUPPORT_PATH}?ticket=91`);

  await expect(
    page.getByRole('status').filter({ hasText: 'Нет доступа к обращению' }),
  ).toBeVisible();
  await expect(reply(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Закрыть обращение' })).toHaveCount(0);
});

test('should join again after a lost connection and load the missed messages', async ({ page }) => {
  const stub = await stubSupport(page);
  await page.goto(`${SUPPORT_PATH}?ticket=91`);
  const log = page.getByRole('log', { name: 'Переписка' });
  await expect(log.getByText('Он уже 5 минут ищет')).toBeVisible();
  await expect.poll(() => stub.socket.ticketJoins.length).toBeGreaterThan(0);
  const joins = stub.socket.ticketJoins.length;

  stub.messages.get(91)?.push({
    id: 77,
    text: 'Пока вас не было',
    createdAt: fromFixedNow(0).toISOString(),
    fromStaff: false,
    authorName: 'Анна Кравец',
    isRead: false,
  });
  await stub.socket.drop();

  await expect.poll(() => stub.socket.ticketJoins.length).toBeGreaterThan(joins);
  await expect(log.getByText('Пока вас не было')).toBeVisible();
  await expect(log.getByText('Он уже 5 минут ищет')).toHaveCount(1);
});

test('should open the chat over the queue on a phone and go back', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await stubSupport(page);
  await page.goto(SUPPORT_PATH);

  await expect(page.getByRole('combobox', { name: 'Сортировка' })).toHaveCount(0);
  await expect(page.getByText('18 мин', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Анна Кравец/ }).click();

  const screen = page.getByRole('region', { name: 'Обращение' });
  await expect(screen.getByRole('heading', { level: 1 })).toHaveText(
    'Курьер не может найти подъезд',
  );
  await expect(screen.getByText('Анна Кравец, клиент')).toBeVisible();
  await expect(screen.getByRole('link', { name: 'Позвонить' })).toHaveAttribute('href', /^tel:/);
  await expect(screen.getByRole('link', { name: 'Открыть' })).toBeVisible();
  await expect(reply(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await screen.getByRole('button', { name: 'К обращениям' }).click();
  await expect(page).toHaveURL(SUPPORT_PATH);
  await expect(screen).toHaveCount(0);
});
