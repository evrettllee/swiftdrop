import type { Page } from '@playwright/test';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import type { AppSocketStub } from './app-socket';
import { fromFixedNow } from './clock';
import { openAsManager } from './manager';
import {
  mapCouriers,
  type MapState,
  OFFER_ORDER_ID,
  type RawMapCourier,
} from './manager-map-fixtures';
import { assignedOrder, minutesAhead, type RawManagerOrder } from './manager-order-fixtures';
import { stubMapbox } from './mapbox';
import { COURIER_SEGMENT, PARCEL_SEGMENT } from './routing';

const MAP_URL = /\/api\/manager\/couriers\/map(\?.*)?$/;
const ORDER_URL = /\/api\/manager\/orders\/(\d+)$/;
const ROUTE_URL = /\/api\/manager\/orders\/\d+\/route$/;

export const MAP_PATH = '/manager/map';
export { mapCouriers, OFFER_ORDER_ID, type RawMapCourier };

export type CouriersMapStub = {
  items: RawMapCourier[];
  status: number;
  requests: URL[];
  order: RawManagerOrder;
  orderRequests: number[];
  routeRequests: number;
  socket: AppSocketStub;
};

function countsOf(items: readonly RawMapCourier[]): Record<MapState, number> {
  const counts: Record<MapState, number> = { free: 0, on_order: 0, offer: 0, no_signal: 0 };

  for (const item of items) {
    counts[item.state] += 1;
  }

  return counts;
}

function matchesSearch(item: RawMapCourier, search: string | null): boolean {
  if (search === null || search === '') {
    return true;
  }

  const normalized = search.toLowerCase();

  return (
    item.name.toLowerCase().includes(normalized) ||
    (item.phone?.toLowerCase().includes(normalized) ?? false)
  );
}

export async function stubCouriersMap(page: Page): Promise<CouriersMapStub> {
  const { socket } = await openAsManager(page);
  await stubMapbox(page);
  const stub: CouriersMapStub = {
    items: mapCouriers(),
    status: 200,
    requests: [],
    order: { ...assignedOrder(), status: 'in_transit', estimatedDeliveryAt: minutesAhead(12) },
    orderRequests: [],
    routeRequests: 0,
    socket,
  };

  await page.route(MAP_URL, (route) => {
    const url = new URL(route.request().url());
    stub.requests.push(url);
    const states = url.searchParams.get('state')?.split(',') ?? null;
    const vehicleTypes = url.searchParams.get('vehicleType')?.split(',') ?? null;
    const search = url.searchParams.get('q')?.trim() ?? null;
    const scoped = stub.items.filter(
      (item) =>
        (vehicleTypes === null ||
          (item.vehicleType !== null && vehicleTypes.includes(item.vehicleType))) &&
        matchesSearch(item, search),
    );
    const items = scoped.filter((item) => states === null || states.includes(item.state));

    return stub.status === 200
      ? route.fulfill({ json: { items, counts: countsOf(scoped) } })
      : route.fulfill({ status: stub.status, json: { message: 'error' } });
  });
  await page.route(ORDER_URL, (route) => {
    stub.orderRequests.push(Number(ORDER_URL.exec(route.request().url())?.[1]));

    return route.fulfill({ json: stub.order });
  });
  await page.route(ROUTE_URL, (route) => {
    stub.routeRequests += 1;

    return route.fulfill({
      json: {
        segments: [COURIER_SEGMENT, PARCEL_SEGMENT],
        courierPosition: null,
        pickupEtaAt: null,
      },
    });
  });

  return stub;
}

export function lastMapRequest(stub: CouriersMapStub): URLSearchParams {
  return stub.requests.at(-1)?.searchParams ?? new URLSearchParams();
}

export function pushLocation(stub: CouriersMapStub, courierId: number, lat: number, lng: number) {
  stub.socket.push(SOCKET_EVENTS.STAFF_COURIER_LOCATION, {
    courierId,
    lat,
    lng,
    at: fromFixedNow(0).toISOString(),
  });
}

export function pushCourierOnline(stub: CouriersMapStub, courierId: number) {
  stub.socket.push(SOCKET_EVENTS.STAFF_COURIER, { courierId, kind: 'online' });
}
