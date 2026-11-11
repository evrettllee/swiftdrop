import { expect, type Page, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { ORDER_CANCELLED_BY, ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { MAP_CLASS, MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { chatMessage, createChatBackend, stubChatBackend } from './support/chat-backend';
import { LIVE_ORDER_ID, openLiveOrder, stubLiveOrder } from './support/live-order';
import { COURIER_PHONE } from './support/order-details';
import { PARCEL_SEGMENT, stubClientOrderRoute } from './support/routing';
import { fixClock, fromFixedNow } from './support/clock';

const MINUTE = 60_000;
const PHONE = { width: 375, height: 812 };
const COURIER_POINT = { latitude: 53.9, longitude: 27.56 };

function statusLine(page: Page, title: string | RegExp) {
  return page.getByRole('heading', { level: 2, name: title });
}

function orderMap(page: Page) {
  return page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
}

async function stubCourierOnMap(
  page: Page,
  isStale: boolean,
  pickupEtaAt: Date | null,
  updatedAt = new Date(),
) {
  await stubClientOrderRoute(page, LIVE_ORDER_ID, () => [PARCEL_SEGMENT], {
    courierPosition: { ...COURIER_POINT, updatedAt, isStale },
    pickupEtaAt,
  });
}

test('should tell that the order waits for the payment above the route, without an alert', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.PENDING;
  await openLiveOrder(page, order);

  await expect(statusLine(page, 'Заказ ждёт оплаты')).toBeVisible();
  await expect(page.getByText(/^Оплатите до \d{2}:\d{2}, иначе заказ отменится/)).toBeVisible();
  await expect(orderMap(page)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('should count the minutes to the pickup on the status line and on the marker', async ({
  page,
}) => {
  await fixClock(page);
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await stubCourierOnMap(page, false, fromFixedNow(6 * MINUTE + 30_000), fromFixedNow(0));
  await openLiveOrder(page, order);

  await expect(statusLine(page, 'Курьер приедет за посылкой через 7 мин')).toBeVisible();
  await expect(orderMap(page).locator(`.${MAP_CLASS.COURIER_ETA_TEXT}`)).toHaveText('7 мин');
});

test('should say the connection with the courier is lost', async ({ page }) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.IN_TRANSIT;
  await stubCourierOnMap(page, true, null);
  await openLiveOrder(page, order);

  await expect(statusLine(page, 'Нет связи с курьером')).toBeVisible();
  await expect(orderMap(page).locator(`.${MAP_CLASS.COURIER_ETA_TEXT}`)).toHaveText(
    ORDER_COURIER_TEXTS.MARKER_OFFLINE,
  );
  await expect(orderMap(page).locator(`.${MAP_CLASS.COURIER_ETA_OFFLINE}`)).toHaveCount(1);
});

test('should show when the order was delivered and to whom, the addresses and no map', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.DELIVERED;
  await openLiveOrder(page, order);

  await expect(statusLine(page, /^Доставлен в \d{2}:\d{2}$/)).toBeVisible();
  await expect(page.getByText('Получатель: Ольга Петрова')).toBeVisible();
  await expect(orderMap(page)).toHaveCount(0);
  await expect(page.getByText('Откуда')).toBeVisible();
  await expect(page.getByRole('link', { name: ORDER_COURIER_TEXTS.CALL })).toHaveCount(0);
  await expect(page.getByRole('button', { name: ORDER_COURIER_TEXTS.CHAT })).toBeVisible();
});

test('should say the unpaid order was cancelled by the time limit only when the system did it', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.CANCELLED;
  order.cancelledBy = ORDER_CANCELLED_BY.SYSTEM;
  await openLiveOrder(page, order);

  await expect(statusLine(page, 'Заказ отменён')).toBeVisible();
  await expect(page.getByText('Не оплачен за 30 минут')).toBeVisible();
  await expect(orderMap(page)).toHaveCount(0);
});

test('should call the courier and open the chat with the unread messages counted', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await stubChatBackend(
    page,
    LIVE_ORDER_ID,
    createChatBackend(CHAT_SENDER_ROLE.CLIENT, [
      chatMessage(1, CHAT_SENDER_ROLE.COURIER, 'Еду к вам'),
      chatMessage(2, CHAT_SENDER_ROLE.COURIER, 'Буду через 7 минут'),
    ]),
  );
  await openLiveOrder(page, order);

  await expect(page.getByRole('link', { name: ORDER_COURIER_TEXTS.CALL })).toHaveAttribute(
    'href',
    `tel:${COURIER_PHONE}`,
  );
  const chat = page.getByRole('button', { name: ORDER_COURIER_TEXTS.CHAT });
  await expect(chat).toHaveText('2');
  await expect(chat).toHaveAccessibleDescription(ORDER_COURIER_TEXTS.chatUnread(2));
  await expect(chat).toHaveAttribute('aria-expanded', 'false');
  await chat.click();
  await expect(page).toHaveURL(/[?&]chat=1(&|$)/);
  await expect(chat).toHaveAttribute('aria-expanded', 'true');
});

test('should put the code right after the status line and the payment last on a phone', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.PICKED_UP;
  await openLiveOrder(page, order);

  const tops = await Promise.all(
    [
      statusLine(page, 'Курьер везёт посылку'),
      page.getByRole('heading', { name: ORDER_COURIER_TEXTS.CODE_SECTION }),
      page.getByRole('heading', { name: 'Маршрут' }),
      page.getByRole('heading', { name: ORDER_COURIER_TEXTS.SECTION, exact: true }),
      page.getByRole('heading', { name: 'Ход заказа' }),
      page.getByRole('heading', { name: 'Получатель и посылка' }),
      page.getByRole('heading', { name: 'Оплата' }),
    ].map(async (heading) => (await heading.boundingBox())?.y ?? Number.NaN),
  );

  expect(tops).toEqual([...tops].sort((first, second) => first - second));
});
