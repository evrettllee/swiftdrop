import { expect, type Page, test } from '@playwright/test';
import { CHAT_TEXTS } from '../src/features/order-chat/config/texts';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { type ChatBackend, chatMessage } from './support/chat-backend';
import {
  clientChat,
  courierMessages,
  openClientChatOrder,
  pushChatMessage,
  setPageHidden,
} from './support/client-chat';

const DESKTOP = { width: 1440, height: 900 };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(DESKTOP);
});

function readIds(chat: ChatBackend): number[] {
  return [...new Set(chat.reads)];
}

async function messageTop(page: Page, content: string): Promise<number> {
  const [message, log] = await Promise.all([
    clientChat.log(page).getByText(content, { exact: true }).boundingBox(),
    clientChat.log(page).boundingBox(),
  ]);

  return (message?.y ?? Number.NaN) - (log?.y ?? 0);
}

test('should open the history in a log beside the order and close it with Escape and X', async ({
  page,
}) => {
  await openClientChatOrder(page, courierMessages(2));
  const button = clientChat.button(page);

  await button.click();
  await expect(clientChat.log(page).getByText('Сообщение курьера 2')).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(clientChat.panel(page)).toHaveAttribute(
    'id',
    (await button.getAttribute('aria-controls')) ?? '',
  );
  await page.keyboard.press('Escape');
  await expect(clientChat.panel(page)).toHaveCount(0);
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');

  await button.click();
  await clientChat.panel(page).getByRole('button', { name: CHAT_TEXTS.CLOSE }).click();
  await expect(clientChat.panel(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('should give every icon button of the chat a name', async ({ page }) => {
  await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();

  for (const button of await clientChat.panel(page).getByRole('button').all()) {
    await expect(button).toHaveAccessibleName(/\S/);
  }
  await expect(
    clientChat.panel(page).getByRole('link', { name: ORDER_COURIER_TEXTS.CALL }),
  ).toBeVisible();
});

test('should load the older messages at the top and keep the shown ones in place', async ({
  page,
}) => {
  const { chat } = await openClientChatOrder(page, courierMessages(45));
  await clientChat.button(page).click();
  await expect(clientChat.log(page).getByText('Сообщение курьера 45')).toBeVisible();
  await expect(clientChat.log(page).getByText('Сообщение курьера 15', { exact: true })).toHaveCount(
    0,
  );

  await clientChat.log(page).evaluate((log) => log.scrollTo({ top: 0 }));
  const before = await messageTop(page, 'Сообщение курьера 16');

  await expect(
    clientChat.log(page).getByText('Сообщение курьера 1', { exact: true }),
  ).toBeAttached();
  expect(chat.pages).toContain(16);
  await expect.poll(() => messageTop(page, 'Сообщение курьера 16')).toBeCloseTo(before, 0);
  await expect(
    clientChat.log(page).getByText('Сообщение курьера 1', { exact: true }),
  ).not.toBeInViewport();
});

test('should close the chat for writing once the order is delivered', async ({ page }) => {
  const { chat } = await openClientChatOrder(page, courierMessages(1), ORDER_STATUS.DELIVERED);
  chat.canSend = false;
  await page.reload();

  await clientChat.button(page).click();

  await expect(clientChat.panel(page).getByText(CHAT_TEXTS.CLOSED)).toBeVisible();
  await expect(clientChat.input(page)).toHaveCount(0);
  await expect(clientChat.quickReplies(page)).toHaveCount(0);
});

test('should count the new messages while the chat is closed and none after reading', async ({
  page,
}) => {
  const { order, chat } = await openClientChatOrder(page);
  const button = clientChat.button(page);

  pushChatMessage(order, chatMessage(1, CHAT_SENDER_ROLE.COURIER, 'Я на месте'));
  pushChatMessage(order, chatMessage(2, CHAT_SENDER_ROLE.COURIER, 'Жду у подъезда'));
  await expect(button).toHaveText('2');
  await expect(button).toHaveAccessibleDescription(ORDER_COURIER_TEXTS.chatUnread(2));

  await button.click();
  await expect.poll(() => readIds(chat)).toEqual([2]);
  await page.keyboard.press('Escape');
  await expect(button).toHaveText('');
});

test('should not mark the messages read while the tab is hidden', async ({ page }) => {
  const { order, chat } = await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();
  await expect.poll(() => readIds(chat)).toEqual([1]);

  await setPageHidden(page, true);
  pushChatMessage(order, chatMessage(2, CHAT_SENDER_ROLE.COURIER, 'Жду у подъезда'));
  await expect(clientChat.log(page).getByText('Жду у подъезда')).toBeAttached();
  expect(readIds(chat)).toEqual([1]);

  await setPageHidden(page, false);
  await expect.poll(() => readIds(chat)).toEqual([1, 2]);
});
