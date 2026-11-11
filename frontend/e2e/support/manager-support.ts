import type { Page, Route } from '@playwright/test';
import type { AppSocketStub } from './app-socket';
import { openAsManager, type CountsStub } from './manager';
import { assignedOrder } from './manager-order-fixtures';
import {
  listOf,
  messagesOf,
  messagesPage,
  ORDER_ID,
  type RawMessage,
  type RawTicket,
  rawTickets,
} from './manager-support-fixtures';
import { fromFixedNow } from './clock';

export const SUPPORT_PATH = '/manager/support';
export { messagesOf, minutesAgo, ORDER_ID } from './manager-support-fixtures';

const TICKETS_URL = /\/api\/manager\/support\/tickets(\?.*)?$/;
const TICKET_URL = /\/api\/manager\/support\/tickets\/(\d+)(\/(messages|read|close))?(\?.*)?$/;
const ORDER_URL = new RegExp(`/api/manager/orders/${ORDER_ID}$`);

export type SupportStub = {
  tickets: RawTicket[];
  messages: Map<number, RawMessage[]>;
  listRequests: URLSearchParams[];
  messageRequests: URLSearchParams[];
  detailRequests: number;
  sent: string[];
  reads: number[];
  closes: number[];
  sendFailure: { status: number; body: object } | 'network' | null;
  counts: CountsStub;
  socket: AppSocketStub;
};

function sendMessage(stub: SupportStub, route: Route, ticketId: number) {
  const { text } = route.request().postDataJSON() as { text: string };
  stub.sent.push(text);

  if (stub.sendFailure === 'network') {
    return route.abort('failed');
  }

  if (stub.sendFailure !== null) {
    return route.fulfill({ status: stub.sendFailure.status, json: stub.sendFailure.body });
  }

  const list = stub.messages.get(ticketId) ?? [];
  const message = {
    id: 1000 + stub.sent.length,
    text,
    createdAt: fromFixedNow(0).toISOString(),
    fromStaff: true,
    authorName: 'Ольга М.',
    isRead: false,
  };
  stub.messages.set(ticketId, [...list, message]);

  return route.fulfill({ status: 201, json: { message } });
}

function closeTicket(stub: SupportStub, ticketId: number) {
  const found = stub.tickets.find((item) => item.id === ticketId);
  stub.closes.push(ticketId);

  if (found !== undefined) {
    Object.assign(found, {
      status: 'closed',
      awaitingStaff: false,
      waitingSec: null,
      closedAt: fromFixedNow(0).toISOString(),
      closedBy: { role: 'staff', name: 'Ольга М.' },
    });
  }

  return found;
}

function handleTicket(stub: SupportStub, route: Route) {
  const url = new URL(route.request().url());
  const [, rawId, , action] = TICKET_URL.exec(url.pathname) ?? [];
  const ticketId = Number(rawId);
  const method = route.request().method();

  if (action === 'messages' && method === 'GET') {
    stub.messageRequests.push(url.searchParams);

    return route.fulfill({
      json: messagesPage(stub.messages.get(ticketId) ?? [], url.searchParams),
    });
  }

  if (action === 'messages') {
    return sendMessage(stub, route, ticketId);
  }

  if (action === 'read') {
    stub.reads.push(ticketId);

    return route.fulfill({ json: { readCount: 1, unreadCount: 0 } });
  }

  const found =
    action === 'close'
      ? closeTicket(stub, ticketId)
      : stub.tickets.find((item) => item.id === ticketId);
  stub.detailRequests += 1;

  return found === undefined
    ? route.fulfill({ status: 404, json: { message: 'Обращение не найдено' } })
    : route.fulfill({ json: found });
}

export async function stubSupport(page: Page): Promise<SupportStub> {
  const { counts, socket } = await openAsManager(page);
  const stub: SupportStub = {
    tickets: rawTickets(),
    messages: new Map([
      [91, messagesOf(3)],
      [92, messagesOf(1)],
      [93, messagesOf(2)],
    ]),
    listRequests: [],
    messageRequests: [],
    detailRequests: 0,
    sent: [],
    reads: [],
    closes: [],
    sendFailure: null,
    counts,
    socket,
  };

  await page.route(TICKETS_URL, (route) => {
    const search = new URL(route.request().url()).searchParams;
    stub.listRequests.push(search);

    return route.fulfill({ json: listOf(stub.tickets, search) });
  });
  await page.route(TICKET_URL, (route) => handleTicket(stub, route));
  await page.route(ORDER_URL, (route) =>
    route.fulfill({ json: { ...assignedOrder(), id: ORDER_ID, status: 'in_transit' } }),
  );

  return stub;
}

export function ticketsOf(stub: SupportStub, view: string): URLSearchParams[] {
  return stub.listRequests.filter(
    (search) => search.get('view') === view && search.get('limit') !== '1',
  );
}
