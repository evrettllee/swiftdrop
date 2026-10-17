import type { Page } from '@playwright/test';
import { ORDER_STATUS, type OrderStatus } from '../../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { TEST_ADDRESSES } from './mapbox';

const FINISHED_AT = Date.UTC(2026, 9, 12, 12, 2);
const STAGE_STEP_MS = 600_000;
const ORDER_PATH = new RegExp(`^${API_BASE_PATH}/couriers/me/orders/(\\d+)$`);

export type OrderAnswer = (orderId: number) => { status: number; json: object };

function stagesOf(status: OrderStatus): OrderStatus[] {
  return status === ORDER_STATUS.CANCELLED
    ? [ORDER_STATUS.COURIER_ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED]
    : [
        ORDER_STATUS.COURIER_ASSIGNED,
        ORDER_STATUS.PICKED_UP,
        ORDER_STATUS.IN_TRANSIT,
        ORDER_STATUS.DELIVERED,
      ];
}

// A finished order as the backend sends it: no sender, no recipient, no phones.
export function historyOrderBody(orderId: number, status: OrderStatus = ORDER_STATUS.DELIVERED) {
  const { SVERDLOVA, PRITYTSKOGO } = TEST_ADDRESSES;
  const stages = stagesOf(status);

  return {
    orderId,
    status,
    finishedAt: new Date(FINISHED_AT).toISOString(),
    pickup: { ...SVERDLOVA, city: 'Минск', apartment: null },
    delivery: { ...PRITYTSKOGO, city: 'Минск', apartment: '47' },
    parcel: { weightKg: 2.5, lengthCm: 40, widthCm: 30, heightCm: 20, isFragile: true },
    distanceKm: 7.98,
    history: stages.map((stage, index) => ({
      status: stage,
      changedAt: new Date(FINISHED_AT - (stages.length - 1 - index) * STAGE_STEP_MS).toISOString(),
    })),
  };
}

const HTTP_OK = 200;

// The answer with the order at its end: delivered or cancelled.
export function answerAs(status: OrderStatus): OrderAnswer {
  return (orderId) => ({ status: HTTP_OK, json: historyOrderBody(orderId, status) });
}

// Answers the order of the address with what `getAnswer` gives at the moment of the request, so a
// test can change the answer. The route of the order is another address and is not caught.
export async function stubHistoryOrder(page: Page, getAnswer: () => OrderAnswer): Promise<void> {
  await page.route(
    (url) => ORDER_PATH.test(url.pathname),
    (route) => {
      const orderId = Number(new URL(route.request().url()).pathname.split('/').at(-1));

      return route.fulfill(getAnswer()(orderId));
    },
  );
}
