import type { Page } from '@playwright/test';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import type { AppSocketStub } from './app-socket';
import { openAsManager } from './manager';
import {
  assignedOrder,
  MANAGER_ORDER_ID,
  minutesAhead,
  type RawManagerOrder,
} from './manager-order-fixtures';
import { stubMapbox } from './mapbox';

const MAP_URL = /\/api\/manager\/couriers\/map(\?.*)?$/;
const ORDER_URL = /\/api\/manager\/orders\/(\d+)$/;

export const MAP_PATH = '/manager/map';
export const OFFER_ORDER_ID = 48240;

type MapState = 'free' | 'on_order' | 'offer' | 'no_signal';

export type RawMapCourier = {
  courierId: number;
  name: string;
  phone: string | null;
  vehicleType: 'foot' | 'bicycle' | 'scooter' | 'car' | 'truck' | null;
  lat: number | null;
  lng: number | null;
  positionAt: string | null;
  positionAgeSec: number | null;
  state: MapState;
  activeOrder: { orderId: number; status: string } | null;
  openOfferOrderId: number | null;
};

function courier(
  courierId: number,
  name: string,
  point: [number, number],
  patch: Partial<RawMapCourier> = {},
): RawMapCourier {
  const ageSec = patch.positionAgeSec ?? 5;

  return {
    courierId,
    name,
    phone: '+375293771290',
    vehicleType: 'car',
    lat: point[0],
    lng: point[1],
    positionAt: new Date(Date.now() - ageSec * 1000).toISOString(),
    positionAgeSec: ageSec,
    state: 'free',
    activeOrder: null,
    openOfferOrderId: null,
    ...patch,
  };
}

export function mapCouriers(): RawMapCourier[] {
  return [
    courier(1, 'Алина Гордей', [53.91, 27.55], { vehicleType: 'scooter' }),
    courier(2, 'Андрей Король', [53.9, 27.58], {
      state: 'on_order',
      activeOrder: { orderId: MANAGER_ORDER_ID, status: 'in_transit' },
    }),
    courier(3, 'Егор Тарасевич', [53.89, 27.53], {
      vehicleType: 'bicycle',
      state: 'offer',
      openOfferOrderId: OFFER_ORDER_ID,
    }),
    courier(4, 'Никита Волчек', [53.88, 27.6], {
      state: 'no_signal',
      positionAgeSec: 240,
    }),
    courier(5, 'Игорь Рыбак', [53.92, 27.57], { vehicleType: 'foot', phone: null }),
  ];
}

export type CouriersMapStub = {
  items: RawMapCourier[];
  status: number;
  requests: URL[];
  order: RawManagerOrder;
  orderRequests: number[];
  socket: AppSocketStub;
};

function countsOf(items: readonly RawMapCourier[]): Record<MapState, number> {
  const counts: Record<MapState, number> = { free: 0, on_order: 0, offer: 0, no_signal: 0 };

  for (const item of items) {
    counts[item.state] += 1;
  }

  return counts;
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
    socket,
  };

  await page.route(MAP_URL, (route) => {
    const url = new URL(route.request().url());
    stub.requests.push(url);
    const states = url.searchParams.get('state')?.split(',') ?? null;
    const items = stub.items.filter((item) => states === null || states.includes(item.state));

    return stub.status === 200
      ? route.fulfill({ json: { items, counts: countsOf(stub.items) } })
      : route.fulfill({ status: stub.status, json: { message: 'error' } });
  });
  await page.route(ORDER_URL, (route) => {
    stub.orderRequests.push(Number(ORDER_URL.exec(route.request().url())?.[1]));

    return route.fulfill({ json: stub.order });
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
    at: new Date().toISOString(),
  });
}

export function pushCourierOnline(stub: CouriersMapStub, courierId: number) {
  stub.socket.push(SOCKET_EVENTS.STAFF_COURIER, { courierId, kind: 'online' });
}
