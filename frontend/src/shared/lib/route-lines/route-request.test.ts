import { expect, test } from '@playwright/test';
import { ApiError, HTTP_STATUS, type RouteLines } from '@/shared/api';
import { fetchRouteOutcome } from './route-outcome';
import { settledRouteKey, shouldAskRoute } from './route-request';

const ORDER_KEY = '990004:courier_assigned';
const NEXT_STATUS_KEY = '990004:picked_up';
const ROUTE: RouteLines = { segments: [] };

function settleWith(load: () => Promise<RouteLines>) {
  return fetchRouteOutcome(load, new AbortController().signal).then((outcome) =>
    settledRouteKey(outcome, ORDER_KEY),
  );
}

test('should ask nothing again for the same order after the route is not found', async () => {
  const settled = await settleWith(() =>
    Promise.reject(new ApiError(HTTP_STATUS.NOT_FOUND, 'Заказ не найден')),
  );

  expect(shouldAskRoute(settled, ORDER_KEY)).toBe(false);
});

test('should ask again after the route is not found when the order changes', async () => {
  const settled = await settleWith(() =>
    Promise.reject(new ApiError(HTTP_STATUS.NOT_FOUND, 'Заказ не найден')),
  );

  expect(shouldAskRoute(settled, NEXT_STATUS_KEY)).toBe(true);
});

test('should keep asking for the same order after a route is found', async () => {
  const settled = await settleWith(() => Promise.resolve(ROUTE));

  expect(shouldAskRoute(settled, ORDER_KEY)).toBe(true);
});

test('should ask for an order nothing was answered for yet', () => {
  expect(shouldAskRoute(null, ORDER_KEY)).toBe(true);
});
