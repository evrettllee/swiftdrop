import type { Page, Route } from '@playwright/test';
import { ORDER_STATUS } from '../../src/shared/api/endpoints/order';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, stubOrderLive } from './app-socket';
import {
  authorMessages,
  clientOrders,
  myTicket,
  myTicketsPage,
  ORDER_ID,
  type RawMyTicket,
  rawMyTickets,
} from './author-support-fixtures';
import { buildOrderStubState, buildTestOrder, stubCourierOnOrder } from './courier-order';
import { messagesPage, type RawMessage } from './manager-support-fixtures';
import { stubSession } from './stub-session';

const TICKETS_URL = /\/api\/support\/tickets(\?.*)?$/;
const TICKET_URL = /\/api\/support\/tickets\/(\d+)(\/(messages|read|close))?(\?.*)?$/;
const CLIENT_ORDERS_URL = /\/api\/orders\?.*$/;
const HISTORY_URL = /\/api\/couriers\/me\/orders\/history(\?.*)?$/;
export const COURIER_ORDER_ID = 990321;

export type AuthorSupportStub = {
  tickets: RawMyTicket[];
  messages: Map<number, RawMessage[]>;
  listRequests: URLSearchParams[];
  created: Record<string, unknown>[];
  createAnswer: { status: number; json: object } | null;
  sent: string[];
  sendFailure: { status: number; json: object } | null;
  reads: number[];
  socket: AppSocketStub;
};

function createTicket(stub: AuthorSupportStub, route: Route) {
  const body = route.request().postDataJSON() as Record<string, unknown>;
  stub.created.push(body);

  if (stub.createAnswer !== null) {
    return route.fulfill(stub.createAnswer);
  }

  const id = 200 + stub.created.length;
  const ticket = myTicket(
    id,
    typeof body.subject === 'string' ? body.subject : 'Проблема с заказом',
    0,
  );
  ticket.awaitingStaff = true;
  stub.tickets.push(ticket);
  stub.messages.set(id, []);

  return route.fulfill({ status: 201, json: ticket });
}

function sendMessage(stub: AuthorSupportStub, route: Route, ticketId: number) {
  const { text } = route.request().postDataJSON() as { text: string };
  stub.sent.push(text);

  if (stub.sendFailure !== null) {
    return route.fulfill(stub.sendFailure);
  }

  const message = {
    id: 1000 + stub.sent.length,
    text,
    createdAt: new Date().toISOString(),
    fromStaff: false,
    authorName: 'Анна Тестова',
    isRead: false,
  };
  stub.messages.set(ticketId, [...(stub.messages.get(ticketId) ?? []), message]);

  return route.fulfill({ status: 201, json: { message } });
}

function handleTicket(stub: AuthorSupportStub, route: Route) {
  const url = new URL(route.request().url());
  const [, rawId, , action] = TICKET_URL.exec(url.pathname) ?? [];
  const ticketId = Number(rawId);
  const found = stub.tickets.find((item) => item.id === ticketId);

  if (found === undefined) {
    return route.fulfill({ status: 404, json: { message: 'Обращение не найдено' } });
  }

  if (action === 'messages' && route.request().method() === 'GET') {
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

  return route.fulfill({ json: found });
}

async function stubRole(page: Page, role: typeof ROLE.CLIENT | typeof ROLE.COURIER) {
  await stubSession(page, role);

  if (role === ROLE.CLIENT) {
    await page.route(CLIENT_ORDERS_URL, (route) =>
      route.fulfill({ json: { items: clientOrders(), total: 2, page: 1, limit: 10 } }),
    );

    return;
  }

  await stubCourierOnOrder(
    page,
    buildOrderStubState(buildTestOrder(COURIER_ORDER_ID, ORDER_STATUS.IN_TRANSIT)),
  );
  await page.route(HISTORY_URL, (route) =>
    route.fulfill({ json: { items: [], page: 1, limit: 10, total: 0 } }),
  );
}

export async function stubAuthorSupport(
  page: Page,
  role: typeof ROLE.CLIENT | typeof ROLE.COURIER = ROLE.CLIENT,
): Promise<AuthorSupportStub> {
  await stubRole(page, role);
  const stub: AuthorSupportStub = {
    tickets: rawMyTickets(),
    messages: new Map([[91, authorMessages()]]),
    listRequests: [],
    created: [],
    createAnswer: null,
    sent: [],
    sendFailure: null,
    reads: [],
    socket: await stubOrderLive(page),
  };

  await page.route(TICKETS_URL, (route) => {
    if (route.request().method() === 'POST') {
      return createTicket(stub, route);
    }

    const search = new URL(route.request().url()).searchParams;
    stub.listRequests.push(search);

    return route.fulfill({ json: myTicketsPage(stub.tickets, search) });
  });
  await page.route(TICKET_URL, (route) => handleTicket(stub, route));

  return stub;
}

export { ORDER_ID };
