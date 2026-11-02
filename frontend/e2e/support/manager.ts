import type { Page } from '@playwright/test';
import { MANAGER_LAYOUT_TEXTS } from '../../src/app/layouts/manager-layout/navigation';
import { MANAGER_ORDERS_API_PATHS } from '../../src/shared/api/endpoints/manager-orders';
import { ORDER_STATUS } from '../../src/shared/api/endpoints/order';
import { SUPPORT_STAFF_API_PATHS } from '../../src/shared/api/endpoints/support';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, stubAppSocket } from './app-socket';
import { stubSession } from './stub-session';

export type CountsStub = {
  attention: number;
  awaiting: number;
  orderRequests: number;
  supportRequests: number;
};

async function stubCounts(page: Page): Promise<CountsStub> {
  const counts: CountsStub = { attention: 3, awaiting: 2, orderRequests: 0, supportRequests: 0 };

  await page.route(`**${API_BASE_PATH}${MANAGER_ORDERS_API_PATHS.COUNTS}`, (route) => {
    counts.orderRequests += 1;

    return route.fulfill({
      json: {
        attention: counts.attention,
        active: 21,
        awaitingPayment: 2,
        finished: 1248,
        cancelled: 37,
        all: 1311,
      },
    });
  });
  await page.route(`**${API_BASE_PATH}${SUPPORT_STAFF_API_PATHS.COUNTS}`, (route) => {
    counts.supportRequests += 1;

    return route.fulfill({ json: { awaiting: counts.awaiting, open: 5 } });
  });

  return counts;
}

export async function openAsManager(
  page: Page,
): Promise<{ counts: CountsStub; socket: AppSocketStub }> {
  await stubSession(page, ROLE.MANAGER);
  const counts = await stubCounts(page);
  const socket = await stubAppSocket(page);

  return { counts, socket };
}

export function managerMenu(page: Page) {
  return page.getByRole('navigation', { name: MANAGER_LAYOUT_TEXTS.NAV_LABEL });
}

export function pushOrderChange(socket: AppSocketStub, orderId: number): void {
  socket.push(SOCKET_EVENTS.STAFF_ORDER, {
    orderId,
    kind: 'status',
    status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
    statusChangedAt: '2026-10-26T12:00:00.000Z',
    courierId: null,
  });
}
