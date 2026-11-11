import { expect, test } from '@playwright/test';
import type { ManagerOrderCounts } from './manager-orders';
import {
  areOrderCountsFresh,
  claimOrderCounts,
  forgetOrderCounts,
  hasOrderCountsOwner,
  ORDER_COUNTS_FRESH_MS,
  rememberOrderCounts,
  shareOrderCounts,
  storedOrderCounts,
} from './order-counts-store';

const COUNTS: ManagerOrderCounts = {
  attention: 3,
  active: 14,
  awaitingPayment: 2,
  finished: 116,
  cancelled: 15,
  all: 150,
};

test.beforeEach(() => {
  forgetOrderCounts();
});

test('should send one request for the callers that ask while it is on the way', async () => {
  let calls = 0;
  const load = async () => {
    calls += 1;

    return COUNTS;
  };

  const [first, second] = await Promise.all([shareOrderCounts(load), shareOrderCounts(load)]);

  expect(calls).toBe(1);
  expect(first).toEqual(COUNTS);
  expect(second).toEqual(COUNTS);
  expect(storedOrderCounts()?.counts).toEqual(COUNTS);
});

test('should keep the counts fresh for thirty seconds', () => {
  rememberOrderCounts(COUNTS, 1_000);

  expect(areOrderCountsFresh(1_000 + ORDER_COUNTS_FRESH_MS - 1)).toBe(true);
  expect(areOrderCountsFresh(1_000 + ORDER_COUNTS_FRESH_MS)).toBe(false);
  forgetOrderCounts();
  expect(areOrderCountsFresh(1_000)).toBe(false);
});

test('should know whether a page owns the counts until it lets them go', () => {
  const release = claimOrderCounts();
  expect(hasOrderCountsOwner()).toBe(true);

  release();
  release();
  expect(hasOrderCountsOwner()).toBe(false);
});
