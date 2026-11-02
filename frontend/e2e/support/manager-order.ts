import type { Page, Request } from '@playwright/test';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import type { AppSocketStub } from './app-socket';
import { openAsManager } from './manager';
import {
  COURIER_ID,
  COURIER_POINT,
  minutesAhead,
  type RawManagerOrder,
} from './manager-order-fixtures';
import { PARCEL_SEGMENT } from './routing';

export * from './manager-order-fixtures';

const ORDER_URL = /\/api\/manager\/orders\/(\d+)$/;
const ROUTE_URL = /\/api\/manager\/orders\/\d+\/route$/;

export type CourierPositionStub = {
  latitude: number;
  longitude: number;
  updatedAt: string;
  isStale: boolean;
};

export type ManagerOrderStub = {
  order: RawManagerOrder;
  status: number;
  courierPosition: CourierPositionStub | null;
  orderRequests: Request[];
  socket: AppSocketStub;
};

export async function stubManagerOrder(
  page: Page,
  order: RawManagerOrder,
): Promise<ManagerOrderStub> {
  const { socket } = await openAsManager(page);
  const stub: ManagerOrderStub = {
    order,
    status: 200,
    courierPosition: null,
    orderRequests: [],
    socket,
  };

  await page.route(ORDER_URL, (route) => {
    stub.orderRequests.push(route.request());

    return stub.status === 200
      ? route.fulfill({ json: stub.order })
      : route.fulfill({ status: stub.status, json: { message: 'error' } });
  });
  await page.route(ROUTE_URL, (route) =>
    route.fulfill({
      json: {
        segments: [PARCEL_SEGMENT],
        courierPosition: stub.courierPosition,
        pickupEtaAt: stub.order.courier === null ? null : minutesAhead(8.5),
      },
    }),
  );

  return stub;
}

export function freshPosition(): CourierPositionStub {
  return { ...COURIER_POINT, updatedAt: new Date().toISOString(), isStale: false };
}

export function pushCourierLocation(stub: ManagerOrderStub, lat: number, lng: number): void {
  stub.socket.push(SOCKET_EVENTS.STAFF_COURIER_LOCATION, {
    courierId: COURIER_ID,
    lat,
    lng,
    at: new Date().toISOString(),
  });
}

export function pushOrderEvent(stub: ManagerOrderStub, orderId: number): void {
  stub.socket.push(SOCKET_EVENTS.STAFF_ORDER, {
    orderId,
    kind: 'status',
    status: stub.order.status,
    statusChangedAt: new Date().toISOString(),
    courierId: null,
  });
}
