import { expect, type Page } from '@playwright/test';
import { AUTH_API_PATHS } from '../../src/shared/api/endpoints/auth';
import {
  ORDER_STATUS,
  type OrderDetails,
  type OrderStatus,
} from '../../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import { getOrderPath } from '../../src/shared/routes/app-routes';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, type OrderJoinAnswer, stubOrderLive } from './app-socket';
import { stubMapbox } from './mapbox';
import { buildTestOrderDetails, stubOrderCourier } from './order-details';
import { PARCEL_SEGMENT, stubClientOrderRoute } from './routing';

export const LIVE_ORDER_ID = 990005;

const TEST_CLIENT = {
  userId: 990005,
  firstName: 'Анна',
  lastName: 'Тестова',
  email: 'order-tracking@example.com',
  phone: null,
  role: ROLE.CLIENT,
};

// An order of the client the page follows with the events of its room. The test changes the
// status the backend answers with and counts the requests of the order.
export type LiveOrder = {
  socket: AppSocketStub;
  status: OrderStatus;
  cancelledBy: OrderDetails['cancelledBy'];
  supportTicket: OrderDetails['supportTicket'];
  requests: number;
  // When each request of the order came, by the clock of the test.
  requestedAt: number[];
  isFailing: boolean;
};

// The session, the order, the courier, the route and the socket all come from stubs. The room is
// joined unless `joinAnswer` says otherwise.
export async function stubLiveOrder(page: Page, joinAnswer?: OrderJoinAnswer): Promise<LiveOrder> {
  const order: LiveOrder = {
    socket: await stubOrderLive(
      page,
      joinAnswer === undefined ? {} : { answerJoin: () => joinAnswer },
    ),
    status: ORDER_STATUS.CONFIRMED,
    cancelledBy: null,
    supportTicket: null,
    requests: 0,
    requestedAt: [],
    isFailing: false,
  };

  await stubMapbox(page);
  await stubClientOrderRoute(page, LIVE_ORDER_ID, () => [PARCEL_SEGMENT]);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({ json: TEST_CLIENT }),
  );
  await page.route(`**${API_BASE_PATH}/orders/${LIVE_ORDER_ID}`, (route) => {
    order.requests += 1;
    order.requestedAt.push(Date.now());

    return order.isFailing
      ? route.fulfill({ status: 500, json: { message: 'Failure' } })
      : route.fulfill({
          json: {
            ...buildTestOrderDetails(LIVE_ORDER_ID, order.status),
            cancelledBy: order.cancelledBy,
            supportTicket: order.supportTicket,
          },
        });
  });
  await stubOrderCourier(page, LIVE_ORDER_ID, () => order.status);

  return order;
}

// Opens the order and waits until the page is in its room and has loaded the order after the join.
export async function openLiveOrder(page: Page, order: LiveOrder): Promise<void> {
  await page.goto(getOrderPath(LIVE_ORDER_ID));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect.poll(() => order.socket.joins).toContain(LIVE_ORDER_ID);
  const joinedAt = order.socket.joinedAt[order.socket.joins.indexOf(LIVE_ORDER_ID)];
  await expect
    .poll(() => order.requestedAt.some((requestedAt) => requestedAt >= joinedAt))
    .toBe(true);
}

// The backend changes the status of the order and tells its room.
export function pushStatus(order: LiveOrder, orderId: number, next: OrderStatus): void {
  if (orderId === LIVE_ORDER_ID) {
    order.status = next;
  }

  order.socket.push(SOCKET_EVENTS.ORDER_STATUS, {
    orderId,
    status: next,
    estimatedDeliveryAt: null,
  });
}
