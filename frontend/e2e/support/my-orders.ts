import type { Page, Route } from '@playwright/test';
import { ROLE } from '../../src/shared/session/auth-user';
import { stubAppSocket } from './app-socket';
import { myOrders, type RawMyOrder } from './my-orders-fixtures';
import { stubSession } from './stub-session';

const LIST_URL = /\/api\/orders(\?.*)?$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINSK_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Minsk',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const GROUPS: Record<string, readonly string[]> = {
  active: [
    'pending',
    'confirmed',
    'awaiting_manual_assignment',
    'courier_assigned',
    'picked_up',
    'in_transit',
  ],
  finished: ['delivered'],
  cancelled: ['cancelled', 'rejected'],
};

function matches(item: RawMyOrder, params: URLSearchParams): boolean {
  const status = params.get('status');
  const q = params.get('q');
  const day = MINSK_DAY.format(new Date(item.createdAt));
  const from = params.get('from');
  const to = params.get('to');

  if (status !== null && !GROUPS[status].includes(item.status)) {
    return false;
  }

  if (from !== null && day < from) {
    return false;
  }

  if (to !== null && day > to) {
    return false;
  }

  if (q === null) {
    return true;
  }

  if (/^\d+$/.test(q)) {
    return item.orderId === Number(q);
  }

  const words = q.replaceAll(/[\s,]+/g, ' ').toLowerCase();

  return [item.pickup, item.delivery].some((point) =>
    `${point.street} ${point.house}`.toLowerCase().includes(words),
  );
}

function sorted(items: RawMyOrder[], sort: string | null): RawMyOrder[] {
  const [key, direction] = (sort ?? 'createdAt:desc').split(':');
  const sign = direction === 'asc' ? 1 : -1;

  return items.toSorted((a, b) =>
    key === 'price' ? sign * (a.price - b.price) : sign * a.createdAt.localeCompare(b.createdAt),
  );
}

export type MyOrdersStub = {
  orders: RawMyOrder[];
  requests: URLSearchParams[];
};

function answer(stub: MyOrdersStub, route: Route) {
  const params = new URL(route.request().url()).searchParams;
  stub.requests.push(params);
  const found = sorted(
    stub.orders.filter((item) => matches(item, params)),
    params.get('sort'),
  );
  const limit = Number(params.get('limit') ?? '10');
  const cursor = params.get('cursor');

  if (cursor === null) {
    const page = Number(params.get('page') ?? '1');
    const items = found.slice((page - 1) * limit, page * limit);

    return route.fulfill({ json: { items, total: found.length, page, limit, until: null } });
  }

  const offset = cursor === '' ? 0 : Number(cursor);
  const end = offset + limit;

  return route.fulfill({
    json: {
      items: found.slice(offset, end),
      nextCursor: end < found.length ? String(end) : null,
      ...(cursor === '' ? { total: found.length } : {}),
    },
  });
}

export async function stubMyOrders(page: Page, orders = myOrders()): Promise<MyOrdersStub> {
  const stub: MyOrdersStub = { orders, requests: [] };
  await stubSession(page, ROLE.CLIENT);
  await stubAppSocket(page);
  await page.route(LIST_URL, (route) => answer(stub, route));

  return stub;
}

export function listRequests(stub: MyOrdersStub): URLSearchParams[] {
  return stub.requests.filter((params) => params.get('limit') !== '1');
}

export function lastListRequest(stub: MyOrdersStub): URLSearchParams | undefined {
  return listRequests(stub).at(-1);
}

export function minskDay(daysAgo: number): string {
  return MINSK_DAY.format(new Date(Date.now() - daysAgo * DAY_MS));
}
