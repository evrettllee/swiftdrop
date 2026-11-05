import { expect, test } from '@playwright/test';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { stubAuthorSupport } from './support/author-support';
import { field, log, staffMessage } from './support/author-support-fixtures';

test('should show the thread with the order and send a reply with each failure explained', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  await page.goto('/support/91');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Курьер не может найти подъезд');
  await expect(page.getByText('Есть ответ')).toBeVisible();
  await expect(log(page).getByText('Ольга, поддержка')).toBeVisible();
  await expect(log(page).getByText('Вы', { exact: true })).toBeVisible();
  const order = page.getByRole('complementary', { name: 'Заказ' });
  await expect(order).toContainText('№48232');
  await expect(order).toContainText('Минск, пр-т Притыцкого, 83');
  await expect(order.getByRole('link', { name: 'Открыть заказ' })).toHaveAttribute(
    'href',
    '/orders/48232',
  );
  await expect.poll(() => stub.reads).toEqual([91]);

  await field(page).fill('Спасибо');
  await field(page).press('Enter');
  await expect(log(page).getByText('Спасибо')).toBeVisible();
  await expect(field(page)).toHaveValue('');

  stub.sendFailure = { status: 429, json: { message: 'Слишком много сообщений' } };
  await field(page).fill('Ещё');
  await field(page).press('Enter');
  await expect(page.getByText('Слишком много сообщений, подождите минуту')).toBeVisible();
  await expect(field(page)).toHaveValue('Ещё');

  stub.sendFailure = { status: 409, json: { code: 'TICKET_CLOSED', message: 'Обращение закрыто' } };
  stub.tickets[0].status = 'closed';
  stub.tickets[0].closedAt = new Date().toISOString();
  await field(page).press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'Обращение закрыто' })).toBeVisible();
  await expect(field(page)).toHaveCount(0);
  await expect(
    page.getByText('Обращение закрыто. Если вопрос остался, создайте новое'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Новое обращение' })).toHaveAttribute(
    'href',
    '/support?new=1&orderId=48232',
  );
});

test('should add live replies once, mark them read and tick own messages read', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  await page.goto('/support/91');
  await expect.poll(() => stub.reads.length).toBe(1);
  await field(page).fill('Жду');
  await field(page).press('Enter');
  await expect(log(page).getByRole('img', { name: 'Отправлено' })).toHaveCount(1);

  stub.socket.push(SOCKET_EVENTS.SUPPORT_MESSAGE, staffMessage(500, 'Курьер уже у подъезда'));
  stub.socket.push(SOCKET_EVENTS.SUPPORT_MESSAGE, staffMessage(500, 'Курьер уже у подъезда'));
  await expect(log(page).getByText('Курьер уже у подъезда')).toHaveCount(1);
  await expect.poll(() => stub.reads.length).toBe(2);

  stub.socket.push(SOCKET_EVENTS.SUPPORT_READ, { ticketId: 91, by: 'staff' });
  await expect(log(page).getByRole('img', { name: 'Отправлено' })).toHaveCount(0);
  await expect(log(page).getByRole('img', { name: 'Прочитано' })).toHaveCount(2);
});

test('should tell about a reply of the support on another page and lead to the ticket', async ({
  page,
}) => {
  const stub = await stubAuthorSupport(page);
  await page.goto(APP_ROUTES.SUPPORT);
  await expect(page.getByRole('list', { name: 'Мои обращения' })).toBeVisible();

  const toast = page.getByRole('status').filter({ hasText: 'Поддержка ответила' });
  stub.tickets[1].awaitingStaff = false;
  stub.socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: 92,
    kind: 'message',
    awaitingStaff: false,
    status: 'open',
  });
  await expect(toast).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Мои обращения' }).getByRole('listitem').nth(1),
  ).toContainText('Есть ответ');
  await toast.getByRole('button', { name: 'Открыть' }).click();
  await expect(page).toHaveURL('/support/92');
  await expect(toast).toHaveCount(0);

  stub.socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: 92,
    kind: 'message',
    awaitingStaff: false,
    status: 'open',
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Не приходят предложения заказов',
  );
  await expect(toast).toHaveCount(0);
});

test('should keep a closed ticket read only with a way to a new one', async ({ page }) => {
  await stubAuthorSupport(page);
  await page.goto('/support/93');

  await expect(page.getByText('Закрыто', { exact: true })).toBeVisible();
  await expect(field(page)).toHaveCount(0);
  await expect(
    page.getByText('Обращение закрыто. Если вопрос остался, создайте новое'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Новое обращение' })).toHaveAttribute(
    'href',
    '/support?new=1',
  );
});

test('should say that a ticket of someone else is not found', async ({ page }) => {
  await stubAuthorSupport(page);
  await page.goto('/support/777');

  await expect(page.getByRole('heading', { name: 'Обращение не найдено' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'К обращениям' })).toHaveAttribute(
    'href',
    '/support',
  );
  await expect(field(page)).toHaveCount(0);
});

test('should open the thread of the courier full screen on a phone and go back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await stubAuthorSupport(page, ROLE.COURIER);
  await page.goto('/courier/support/91');

  const screen = page.getByRole('region', { name: 'Курьер не может найти подъезд' });
  await expect(screen.getByText('Поддержка SwiftDrop')).toBeVisible();
  await expect(screen.getByRole('link', { name: 'Открыть', exact: true })).toHaveAttribute(
    'href',
    APP_ROUTES.COURIER_WORK,
  );
  await expect(field(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await screen.getByRole('link', { name: 'Назад к обращениям' }).click();
  await expect(page).toHaveURL(APP_ROUTES.COURIER_SUPPORT);
});
