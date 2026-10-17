import type { Page } from '@playwright/test';
import {
  COURIERS_API_PATHS,
  type CourierMe,
  VEHICLE_TYPE,
} from '../../src/shared/api/endpoints/courier';
import {
  COURIER_ORDERS_API_PATHS,
  type CourierOrder,
} from '../../src/shared/api/endpoints/courier-order';
import { COURIER_OFFERS_API_PATHS } from '../../src/shared/api/endpoints/courier-offer';
import type { OrderStatus } from '../../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { TEST_ADDRESSES } from './mapbox';

const CITY = 'Минск';

// The order the cabinet shows; the test changes it, the stubs answer with what it is now.
export type OrderStubState = {
  order: CourierOrder | null;
  profile: CourierMe;
};

// An order of the test addresses at the given stage.
export function buildTestOrder(orderId: number, status: OrderStatus): CourierOrder {
  const { SVERDLOVA, PRITYTSKOGO } = TEST_ADDRESSES;

  return {
    orderId,
    status,
    pickup: { ...SVERDLOVA, city: CITY, apartment: null },
    delivery: { ...PRITYTSKOGO, city: CITY, apartment: '47' },
    sender: { name: 'Анна Кравец', phone: '+375337654321' },
    recipient: { name: 'Ирина Козлова', phone: '+375291234567' },
    parcel: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true },
    distanceKm: 7.98,
  };
}

// A courier on a bicycle who carries the order, without touching the seeded courier. On the line
// the page follows the device, so the position of the courier is known (the backend refuses it).
export function buildOrderStubState(order: CourierOrder, isAvailable = false): OrderStubState {
  return {
    order,
    profile: {
      isAvailable,
      vehicle: { type: VEHICLE_TYPE.BICYCLE, brand: null, model: null, licensePlate: null },
      activeOrderId: order.orderId,
    },
  };
}

// The profile, the current order and no offer, all from the state. No order makes the profile
// free of it too, as the backend would answer after a cancellation.
export async function stubCourierOnOrder(page: Page, state: OrderStubState): Promise<void> {
  await page.route(`**${API_BASE_PATH}${COURIERS_API_PATHS.ME}`, (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: state.profile }) : route.fallback(),
  );
  await page.route(`**${API_BASE_PATH}${COURIER_OFFERS_API_PATHS.CURRENT}`, (route) =>
    route.fulfill({ json: { offer: null } }),
  );
  await page.route(`**${API_BASE_PATH}${COURIER_ORDERS_API_PATHS.CURRENT}`, (route) => {
    if (state.order === null) {
      state.profile = { ...state.profile, activeOrderId: null };
    }

    return route.fulfill({ json: { order: state.order } });
  });
}

// The backend answers a step of the order with this status and body.
export async function stubOrderStep(
  page: Page,
  path: string,
  answer: () => { status: number; json: object },
): Promise<void> {
  await page.route(`**${API_BASE_PATH}${path}`, (route) =>
    route.request().method() === 'POST' ? route.fulfill(answer()) : route.fallback(),
  );
}
