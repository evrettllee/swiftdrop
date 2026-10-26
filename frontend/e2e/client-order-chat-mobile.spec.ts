import { expect, test } from '@playwright/test';
import { CLIENT_LAYOUT_TEXTS } from '../src/app/layouts/client-layout/navigation';
import { CHAT_TEXTS } from '../src/features/order-chat/config/texts';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { LIVE_ORDER_ID } from './support/live-order';
import { clientChat, courierMessages, openClientChatOrder } from './support/client-chat';

const PHONE = { width: 375, height: 812 };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(PHONE);
});

function bottomNav(page: Parameters<typeof clientChat.button>[0]) {
  return page.getByRole('navigation', { name: CLIENT_LAYOUT_TEXTS.NAV_LABEL });
}

test('should open the chat as a screen by the link and close it with «К заказу»', async ({
  page,
}) => {
  await openClientChatOrder(page, courierMessages(2));
  await page.goto(`${getOrderPath(LIVE_ORDER_ID)}?chat=1`);

  await expect(clientChat.log(page).getByText('Сообщение курьера 2')).toBeVisible();
  await expect(bottomNav(page)).toHaveCount(0);

  await clientChat.panel(page).getByRole('button', { name: CHAT_TEXTS.BACK }).click();

  await expect(clientChat.panel(page)).toHaveCount(0);
  await expect(page).not.toHaveURL(/[?&]chat=1/);
  await expect(bottomNav(page)).toBeVisible();
  await expect(clientChat.button(page)).toBeFocused();
});

test('should close the chat screen with the back button of the browser', async ({ page }) => {
  await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();
  await expect(clientChat.panel(page)).toBeVisible();

  await page.goBack();

  await expect(clientChat.panel(page)).toHaveCount(0);
  await expect(page).toHaveURL(getOrderPath(LIVE_ORDER_ID));
  await expect(bottomNav(page)).toBeVisible();
});

test('should scroll the quick replies sideways on a phone', async ({ page }) => {
  await openClientChatOrder(page, courierMessages(1));
  await clientChat.button(page).click();
  const replies = clientChat.quickReplies(page);
  await expect(replies).toBeVisible();

  const scroll = await replies.evaluate((group) => {
    const before = group.scrollLeft;
    group.scrollBy({ left: 200 });

    return {
      overflowX: getComputedStyle(group).overflowX,
      isWider: group.scrollWidth > group.clientWidth,
      moved: group.scrollLeft > before,
    };
  });

  expect(scroll).toEqual({ overflowX: 'auto', isWider: true, moved: true });
});
