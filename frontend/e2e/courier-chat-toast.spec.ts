import { expect, type Page, test } from '@playwright/test';
import { COURIER_CHAT_TEXTS } from '../src/pages/courier-work/config/texts';
import { CHAT_SENDER_ROLE, type ChatSenderRole } from '../src/shared/api/endpoints/chat';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  CHAT_ORDER_ID,
  CLIENT_MESSAGE,
  type CourierChatStub,
  stubCourierChat,
} from './support/courier-chat';
import { stubHistory } from './support/courier-history';

const SENDER_NAME = 'Анна Кравец';
const NEW_TEXT = 'Я у второго подъезда';

function toast(page: Page) {
  return page.getByRole('status').filter({ hasText: SENDER_NAME });
}

function chatButton(page: Page) {
  return page.getByRole('button', { name: COURIER_CHAT_TEXTS.CHAT_LABEL });
}

function pushMessage(
  stub: CourierChatStub,
  messageId: number,
  senderRole: ChatSenderRole = CHAT_SENDER_ROLE.CLIENT,
) {
  stub.socket.push(SOCKET_EVENTS.MESSAGE_NEW, {
    orderId: CHAT_ORDER_ID,
    message: { ...CLIENT_MESSAGE, messageId, senderRole, content: `${NEW_TEXT} ${messageId}` },
  });
}

async function setPageHidden(page: Page, isHidden: boolean): Promise<void> {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, isHidden);
}

async function openWork(page: Page): Promise<CourierChatStub> {
  const stub = await stubCourierChat(page, ORDER_STATUS.COURIER_ASSIGNED);
  await page.goto(APP_ROUTES.COURIER_WORK);
  await expect(chatButton(page)).toHaveText(`${COURIER_CHAT_TEXTS.CHAT}1`);

  return stub;
}

test('should show the message of the sender in a toast and open the chat from it', async ({
  page,
}) => {
  const stub = await openWork(page);

  pushMessage(stub, 2);

  await expect(toast(page)).toContainText(`${NEW_TEXT} 2`);
  await expect(chatButton(page)).toHaveText(`${COURIER_CHAT_TEXTS.CHAT}2`);
  await expect(chatButton(page)).not.toBeFocused();
  await toast(page).getByRole('button', { name: 'Ответить' }).click();
  await expect(page).toHaveURL(/[?&]chat=1(&|$)/);
  await expect(page.getByRole('dialog', { name: COURIER_CHAT_TEXTS.CHAT_LABEL })).toBeVisible();
  await expect(toast(page)).toHaveCount(0);
});

test('should show no toast for an own message or while the chat is open', async ({ page }) => {
  const stub = await openWork(page);

  pushMessage(stub, 2, CHAT_SENDER_ROLE.COURIER);
  await chatButton(page).click();
  pushMessage(stub, 3);

  await expect(page.getByRole('log').getByText(`${NEW_TEXT} 3`)).toBeVisible();
  await expect(toast(page)).toHaveCount(0);
});

test('should close the toast with Escape', async ({ page }) => {
  const stub = await openWork(page);
  pushMessage(stub, 2);
  await expect(toast(page)).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(toast(page)).toHaveCount(0);
});

test('should show the last message of a hidden tab when the courier comes back', async ({
  page,
}) => {
  const stub = await openWork(page);
  await setPageHidden(page, true);
  pushMessage(stub, 2);
  pushMessage(stub, 3);
  await expect(chatButton(page)).toHaveText(`${COURIER_CHAT_TEXTS.CHAT}3`);
  await expect(toast(page)).toHaveCount(0);

  await setPageHidden(page, false);

  await expect(toast(page)).toContainText(`${NEW_TEXT} 3`);
  await expect(toast(page)).not.toContainText(`${NEW_TEXT} 2`);
});

test('should lead from another page of the cabinet to the chat of the order', async ({ page }) => {
  const stub = await stubCourierChat(page, ORDER_STATUS.IN_TRANSIT);
  await stubHistory(page);
  await page.goto(APP_ROUTES.COURIER_HISTORY);
  await expect.poll(() => stub.socket.joins).toContain(CHAT_ORDER_ID);

  pushMessage(stub, 2);
  await page
    .getByRole('status')
    .filter({ hasText: `${NEW_TEXT} 2` })
    .getByRole('button', { name: 'Ответить' })
    .click();

  await expect(page).toHaveURL(new RegExp(`${APP_ROUTES.COURIER_WORK}\\?chat=1$`));
  await expect(page.getByRole('log').getByText(`${NEW_TEXT} 2`)).toBeVisible();
});
