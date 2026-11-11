import { expect, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { HTTP_STATUS } from '../src/shared/api/request-config';
import { CHAT_UI_TEXTS } from '../src/shared/config/chat';
import {
  clientChat,
  courierMessages,
  openClientChatOrder,
  pushChatMessage,
  pushChatRead,
} from './support/client-chat';

const DESKTOP = { width: 1440, height: 900 };
const TEXT = 'Подъезд со двора, домофон 13';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(DESKTOP);
});

test('should send a message once, whether the answer or message:new brings it', async ({
  page,
}) => {
  const { order, chat } = await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();

  await clientChat.input(page).fill(TEXT);
  await clientChat.input(page).press('Enter');

  await expect(clientChat.log(page).getByText(TEXT)).toHaveCount(1);
  await expect(clientChat.input(page)).toHaveValue('');
  const [sent] = chat.messages.slice(-1);
  expect(chat.sent).toEqual([TEXT]);
  pushChatMessage(order, sent);
  pushChatMessage(order, courierMessages(1, 3)[0]);
  await expect(clientChat.log(page).getByText('Сообщение курьера 3')).toBeVisible();
  await expect(clientChat.log(page).getByText(TEXT)).toHaveCount(1);
});

test('should mark an own message read with two checks after message:read', async ({ page }) => {
  const { order, chat } = await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();
  await clientChat.input(page).fill(TEXT);
  await clientChat.panel(page).getByRole('button', { name: CHAT_UI_TEXTS.SEND }).click();
  const own = clientChat.log(page).getByText(TEXT).locator('..');
  await expect(own.getByRole('img', { name: CHAT_UI_TEXTS.SENT })).toBeVisible();

  pushChatRead(order, chat.messages.at(-1)?.messageId ?? 0);

  await expect(own.getByRole('img', { name: CHAT_UI_TEXTS.READ })).toBeVisible();
});

test('should send a quick reply at once', async ({ page }) => {
  const { chat } = await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();
  const [reply] = ORDER_COURIER_TEXTS.QUICK_REPLIES;

  await clientChat.quickReplies(page).getByRole('button', { name: reply }).click();

  await expect(clientChat.log(page).getByText(reply)).toBeVisible();
  expect(chat.sent).toEqual([reply]);
});

const REFUSALS = [
  { status: HTTP_STATUS.CONFLICT, message: 'Чат откроется, когда курьер примет заказ' },
  { status: HTTP_STATUS.TOO_MANY_REQUESTS, message: 'Слишком много сообщений. Подождите минуту' },
];

for (const refusal of REFUSALS) {
  test(`should show the text of the backend and keep the message on ${refusal.status}`, async ({
    page,
  }) => {
    const { chat } = await openClientChatOrder(page, courierMessages(1));
    chat.refusal = refusal;
    await clientChat.button(page).click();

    await clientChat.input(page).fill(TEXT);
    await clientChat.input(page).press('Enter');

    await expect(clientChat.panel(page).getByText(refusal.message)).toBeVisible();
    await expect(clientChat.input(page)).toHaveValue(TEXT);
    await expect(clientChat.input(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(clientChat.log(page).getByText(TEXT)).toHaveCount(0);
  });
}
