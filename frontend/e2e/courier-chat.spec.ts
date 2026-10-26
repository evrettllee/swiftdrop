import { expect, type Page, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { COURIER_CHAT_TEXTS, ORDER_STEP_TEXTS } from '../src/pages/courier-work/config/texts';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { CHAT_ORDER_ID, CLIENT_MESSAGE, stubCourierChat } from './support/courier-chat';

const PHONE = { width: 375, height: 812 };
const SENDER_PHONE = '+375337654321';

function chatButton(page: Page) {
  return page.getByRole('button', { name: COURIER_CHAT_TEXTS.CHAT_LABEL });
}

function chat(page: Page) {
  const name = COURIER_CHAT_TEXTS.CHAT_LABEL;

  return page.getByRole('dialog', { name }).or(page.getByRole('region', { name, exact: true }));
}

function quickReplies(page: Page) {
  return chat(page).getByRole('group').getByRole('button');
}

test('should count the unread messages of the sender and open the chat beside the order', async ({
  page,
}) => {
  const stub = await stubCourierChat(page, ORDER_STATUS.COURIER_ASSIGNED);
  await page.goto(APP_ROUTES.COURIER_WORK);

  await expect(chatButton(page)).toHaveText(`${COURIER_CHAT_TEXTS.CHAT}1`);
  await expect(chatButton(page)).toHaveAccessibleDescription(COURIER_CHAT_TEXTS.unread(1));
  await expect(chatButton(page)).toHaveAttribute('aria-expanded', 'false');

  await chatButton(page).click();

  await expect(page).toHaveURL(/[?&]chat=1(&|$)/);
  await expect(chatButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(chat(page)).toHaveAttribute(
    'id',
    (await chatButton(page).getAttribute('aria-controls')) ?? '',
  );
  await expect(chat(page).getByRole('heading', { name: 'Анна Кравец' })).toBeVisible();
  await expect(chat(page).getByText(`Отправитель, заказ №${CHAT_ORDER_ID}`)).toBeVisible();
  await expect(chat(page).getByRole('link', { name: COURIER_CHAT_TEXTS.CALL })).toHaveAttribute(
    'href',
    `tel:${SENDER_PHONE}`,
  );
  await expect(chat(page).getByText(CLIENT_MESSAGE.content)).toBeVisible();
  await expect(quickReplies(page)).toHaveText([...COURIER_CHAT_TEXTS.BEFORE_PICKUP_REPLIES]);
  await expect.poll(() => stub.chat.reads.length).toBeGreaterThan(0);
  await expect(chatButton(page)).toHaveText(COURIER_CHAT_TEXTS.CHAT);

  await page.keyboard.press('Escape');
  await expect(chat(page)).toHaveCount(0);
  await expect(chatButton(page)).toBeFocused();
});

test('should count a new message of the sender while the chat is closed', async ({ page }) => {
  const stub = await stubCourierChat(page, ORDER_STATUS.IN_TRANSIT);
  await page.goto(APP_ROUTES.COURIER_WORK);
  await expect(chatButton(page)).toHaveText(`${COURIER_CHAT_TEXTS.CHAT}1`);

  stub.socket.push(SOCKET_EVENTS.MESSAGE_NEW, {
    orderId: CHAT_ORDER_ID,
    message: { ...CLIENT_MESSAGE, messageId: 2, senderRole: CHAT_SENDER_ROLE.CLIENT },
  });

  await expect(chatButton(page)).toHaveText(`${COURIER_CHAT_TEXTS.CHAT}2`);
});

test('should open the chat as a screen on a phone without the menu and the main button', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await stubCourierChat(page, ORDER_STATUS.IN_TRANSIT);
  await page.goto(APP_ROUTES.COURIER_WORK);
  await chatButton(page).click();

  await expect(quickReplies(page)).toHaveText([...COURIER_CHAT_TEXTS.AFTER_PICKUP_REPLIES]);
  await expect(page.getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: ORDER_STEP_TEXTS.ENTER_CODE })).toHaveCount(0);

  await page.goBack();

  await expect(chat(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: ORDER_STEP_TEXTS.ENTER_CODE })).toBeVisible();
});

test('should close the chat when the courier goes to enter the code', async ({ page }) => {
  await stubCourierChat(page, ORDER_STATUS.IN_TRANSIT);
  await page.goto(`${APP_ROUTES.COURIER_WORK}?chat=1`);
  await expect(chat(page)).toBeVisible();

  await page.getByRole('button', { name: ORDER_STEP_TEXTS.ENTER_CODE }).first().press('Enter');

  await expect(chat(page)).toHaveCount(0);
  await expect(page).not.toHaveURL(/[?&]chat=1/);
});
