import type { Page } from '@playwright/test';
import {
  ORDER_STATUS,
  ORDERS_API_PATHS,
  type OrderDetails,
  type OrderStatus,
} from '../../src/shared/api/endpoints/order';
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

// The backend answers that the signed-in client has this order.
export async function stubOrderDetails(
  page: Page,
  orderId: number,
  status?: OrderStatus,
): Promise<void> {
  await page.route(`**${API_BASE_PATH}${ORDERS_API_PATHS.ORDERS}/${orderId}`, (route) =>
    route.fulfill({ json: buildTestOrderDetails(orderId, status) }),
  );
}
