import type { Page, Route } from '@playwright/test';
import { ORDER_STATUS, type OrderStatus } from '../../src/shared/api/endpoints/order';
import type { ManagerOrderListItem } from '../../src/shared/staff-api/manager-orders';
import { type AppSocketStub } from './app-socket';
import { openAsManager, type CountsStub } from './manager';
import { fromFixedNow } from './clock';

const LIST_URL = /\/api\/manager\/orders(\?.*)?$/;
const COUNTS_URL = /\/api\/manager\/orders\/counts(\?.*)?$/;
const EXPORT_URL = /\/api\/manager\/orders\/export(\?.*)?$/;
const LOOKUP_URL = /\/api\/manager\/couriers\/lookup(\?.*)?$/;

export const FIRST_ORDER_ID = 48236;
export const LIST_UNTIL = 48240;
export const NEXT_CURSOR = 'e2e-next';

type RawOrder = Omit<ManagerOrderListItem, 'createdAt' | 'statusChangedAt'> & {
  createdAt: string;
  statusChangedAt: string;
};

export function buildOrder(index: number, status: OrderStatus = ORDER_STATUS.CONFIRMED): RawOrder {
  const id = FIRST_ORDER_ID - index;

  return {
    id,
    createdAt: fromFixedNow(-(index + 1) * 60_000).toISOString(),
    status,
    statusChangedAt: fromFixedNow(-35 * 60_000).toISOString(),
    price: 14.6 + index,
    client: { name: `Ирина Лис ${index}`, phone: '+375334021788' },
    route: {
      from: { street: 'ул. Немига', house: '5' },
      to: { street: 'ул. Кальварийская', house: '21' },
    },
    courier: index % 2 === 0 ? null : { id: 7, name: 'Павел Новиков' },
    fragile: false,
    paymentState: 'paid',
  };
}

export type OrdersStub = {
  lists: URL[];
  counts: URL[];
  exports: URL[];
  lookups: URL[];
  total: number;
  status: OrderStatus;
  isEmpty: boolean;
  exportAnswer: (route: Route) => Promise<void>;
  countsStub: CountsStub;
  socket: AppSocketStub;
};

function answerList(stub: OrdersStub, url: URL) {
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const page = Number(url.searchParams.get('page') ?? '1');
  const cursor = url.searchParams.get('cursor');
  const offset = cursor === null ? (page - 1) * limit : cursor === '' ? 0 : limit;
  const count = stub.isEmpty ? 0 : Math.max(0, Math.min(limit, stub.total - offset));
  const items = Array.from({ length: count }, (_, index) =>
    buildOrder(offset + index, stub.status),
  );
  const total = stub.isEmpty ? 0 : stub.total;

  if (cursor !== null) {
    const nextCursor = offset + count < total ? NEXT_CURSOR : null;

    return cursor === '' ? { items, nextCursor, total } : { items, nextCursor };
  }

  return { items, total, page, limit, until: Number(url.searchParams.get('until') ?? LIST_UNTIL) };
}

export async function stubManagerOrders(page: Page): Promise<OrdersStub> {
  const { counts: countsStub, socket } = await openAsManager(page);
  const stub: OrdersStub = {
    lists: [],
    counts: [],
    exports: [],
    lookups: [],
    total: 148,
    status: ORDER_STATUS.CONFIRMED,
    isEmpty: false,
    exportAnswer: (route) =>
      route.fulfill({
        body: 'id;status',
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="swiftdrop-orders-2026-11-02.csv"',
        },
      }),
    countsStub,
    socket,
  };

  await page.route(LIST_URL, (route) => {
    const url = new URL(route.request().url());
    stub.lists.push(url);

    return route.fulfill({ json: answerList(stub, url) });
  });
  await page.route(COUNTS_URL, (route) => {
    const url = new URL(route.request().url());
    stub.counts.push(url);
    const all = stub.isEmpty ? 0 : stub.total;

    return route.fulfill({
      json: {
        attention: stub.isEmpty ? 0 : countsStub.attention,
        active: 14,
        awaitingPayment: 0,
        finished: 116,
        cancelled: 15,
        all,
      },
    });
  });
  await page.route(EXPORT_URL, (route) => {
    stub.exports.push(new URL(route.request().url()));

    return stub.exportAnswer(route);
  });
  await page.route(LOOKUP_URL, (route) => {
    stub.lookups.push(new URL(route.request().url()));

    return route.fulfill({ json: [{ courierId: 7, name: 'Павел Новиков', vehicleType: 'car' }] });
  });

  return stub;
}

export async function settleRequests(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

export function lastList(stub: OrdersStub): URLSearchParams {
  return stub.lists.at(-1)?.searchParams ?? new URLSearchParams();
}

export function pushStaffOrder(
  stub: OrdersStub,
  kind: 'created' | 'status',
  orderId: number,
): void {
  stub.socket.push('staff:order', {
    orderId,
    kind,
    status: ORDER_STATUS.CONFIRMED,
    statusChangedAt: fromFixedNow(0).toISOString(),
    courierId: null,
  });
}
