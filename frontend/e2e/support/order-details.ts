import type { Page } from '@playwright/test';
import {
  ORDER_STATUS,
  ORDERS_API_PATHS,
  type OrderDetails,
  type OrderStatus,
} from '../../src/shared/api/endpoints/order';
import { VEHICLE_TYPE } from '../../src/shared/api/endpoints/courier';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { TEST_ADDRESSES } from './mapbox';

const CITY = 'Минск';
const { SVERDLOVA, PRITYTSKOGO } = TEST_ADDRESSES;

// An order of the test addresses, by default with a courier assigned, as GET /api/orders/:orderId
// answers it.
export function buildTestOrderDetails(
  orderId: number,
  status: OrderStatus = ORDER_STATUS.COURIER_ASSIGNED,
): OrderDetails {
  const createdAt = new Date();

  return {
    orderId,
    status,
    price: 9.23,
    currency: 'BYN',
    priceCoefficient: 1,
    distanceKm: 7.98,
    estimatedDeliveryAt: null,
    createdAt,
    recipient: { name: 'Ольга Петрова', phone: '+375291234567' },
    parcel: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: false },
    pickup: { ...SVERDLOVA, city: CITY, apartment: null },
    delivery: { ...PRITYTSKOGO, city: CITY, apartment: '4' },
    history: [{ status, changedAt: createdAt }],
    payment: null,
  };
}

export const COURIER_NAME = 'Дмитрий С.';
// The phone of the courier is in the answer of the backend; the page must not show it.
export const COURIER_PHONE = '+375 29 555-66-77';
export const COURIER_PHONE_DIGITS = '5556677';
// Four digits the page shows as "Код 4 8 2 7".
export const DELIVERY_CODE = '4827';

const COURIER_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.DELIVERED,
];
const CODE_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];

// The answer of GET /api/orders/:orderId/courier for an order at this status: the courier from
// the assignment on, the code only while the parcel is on its way.
export function buildTestOrderCourier(status: OrderStatus) {
  return {
    courier: COURIER_VISIBLE_STATUSES.includes(status)
      ? {
          name: COURIER_NAME,
          phone: COURIER_PHONE,
          vehicle: {
            type: VEHICLE_TYPE.CAR,
            brand: 'Skoda',
            model: 'Octavia',
            licensePlate: '1234 AB-7',
          },
        }
      : null,
    deliveryCode: CODE_VISIBLE_STATUSES.includes(status) ? DELIVERY_CODE : null,
  };
}

// The courier and the code of the order at the status `getStatus` gives at the moment of the request.
export async function stubOrderCourier(
  page: Page,
  orderId: number,
  getStatus: () => OrderStatus,
): Promise<void> {
  await page.route(`**${API_BASE_PATH}${ORDERS_API_PATHS.ORDERS}/${orderId}/courier`, (route) =>
    route.fulfill({ json: buildTestOrderCourier(getStatus()) }),
  );
}

// The backend answers that the signed-in client has this order, and who carries it.
export async function stubOrderDetails(
  page: Page,
  orderId: number,
  status: OrderStatus = ORDER_STATUS.COURIER_ASSIGNED,
): Promise<void> {
  await page.route(`**${API_BASE_PATH}${ORDERS_API_PATHS.ORDERS}/${orderId}`, (route) =>
    route.fulfill({ json: buildTestOrderDetails(orderId, status) }),
  );
  await stubOrderCourier(page, orderId, () => status);
}
