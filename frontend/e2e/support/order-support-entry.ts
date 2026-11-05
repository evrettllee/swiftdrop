import type { Page } from '@playwright/test';
import type { OrderSupportTicket } from '../../src/shared/api/endpoints/order';

export const ENTRY_TICKET_ID = 91;

export function openTicket(patch: Partial<OrderSupportTicket> = {}): OrderSupportTicket {
  const lastMessageAt = new Date();
  lastMessageAt.setHours(15, 21, 0, 0);

  return {
    ticketId: ENTRY_TICKET_ID,
    status: 'open',
    awaitingStaff: false,
    unreadCount: 0,
    lastMessageAt,
    ...patch,
  };
}

export async function stubSupportPages(page: Page): Promise<void> {
  await page.route(/\/api\/support\/tickets(\/.*)?(\?.*)?$/, (route) =>
    route.fulfill({ json: { items: [], nextCursor: null, total: 0 } }),
  );
  await page.route(/\/api\/orders\?.*$/, (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 1, limit: 10 } }),
  );
  await page.route(/\/api\/couriers\/me\/orders\/history(\?.*)?$/, (route) =>
    route.fulfill({ json: { items: [], page: 1, limit: 10, total: 0 } }),
  );
}

export function helpButton(page: Page) {
  return page.getByRole('link', { name: 'Нужна помощь с заказом' });
}

export function ticketRow(page: Page) {
  return page.getByRole('link', { name: /^Обращение по заказу/ });
}
