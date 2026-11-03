import { expect, test } from '@playwright/test';
import type { CourierMapItem } from '@/shared/staff-api';
import { MAP_FILTER } from '../config/map';
import { filterChips, isInFilter, liveCounts, liveState, statesOf } from './courier-state';
import { toLiveCouriers } from './live-couriers';

const NOW = 1_000_000_000;

function item(courierId: number, patch: Partial<CourierMapItem> = {}): CourierMapItem {
  return {
    courierId,
    name: `Курьер ${courierId}`,
    phone: null,
    vehicleType: 'car',
    lat: 53.9,
    lng: 27.56,
    positionAt: new Date(NOW - 5000),
    positionAgeSec: 5,
    state: 'free',
    activeOrder: null,
    openOfferOrderId: null,
    ...patch,
  };
}

test('should ask for the free couriers and those with an offer under one chip', () => {
  expect(statesOf(null)).toBeNull();
  expect(statesOf(MAP_FILTER.FREE)).toEqual(['free', 'offer']);
  expect(statesOf(MAP_FILTER.ON_ORDER)).toEqual(['on_order']);
  expect(statesOf(MAP_FILTER.NO_SIGNAL)).toEqual(['no_signal']);
  expect(isInFilter('offer', MAP_FILTER.FREE)).toBe(true);
  expect(isInFilter('offer', MAP_FILTER.ON_ORDER)).toBe(false);
});

test('should sum the four states of the API into the chips of the design', () => {
  const chips = filterChips({ free: 5, offer: 2, on_order: 4, no_signal: 1 });

  expect(chips).toEqual([
    { filter: null, count: 12 },
    { filter: MAP_FILTER.FREE, count: 7 },
    { filter: MAP_FILTER.ON_ORDER, count: 4 },
    { filter: MAP_FILTER.NO_SIGNAL, count: 1 },
  ]);
});

test('should take the state from the order, the offer and the age of the position', () => {
  const fresh = NOW - 60_000;

  expect(liveState({ seenAt: fresh, activeOrder: null, openOfferOrderId: null }, NOW)).toBe('free');
  expect(liveState({ seenAt: fresh, activeOrder: null, openOfferOrderId: 7 }, NOW)).toBe('offer');
  expect(
    liveState(
      { seenAt: fresh, activeOrder: { orderId: 7, status: 'in_transit' }, openOfferOrderId: 7 },
      NOW,
    ),
  ).toBe('on_order');
  expect(liveState({ seenAt: fresh - 1, activeOrder: null, openOfferOrderId: null }, NOW)).toBe(
    'no_signal',
  );
  expect(liveState({ seenAt: null, activeOrder: null, openOfferOrderId: null }, NOW)).toBe(
    'no_signal',
  );
});

test('should lose the signal of a courier once the position is older than a minute', () => {
  const items = [
    item(1, { positionAgeSec: 50 }),
    item(2, { positionAgeSec: 5, state: 'offer', openOfferOrderId: 9 }),
  ];

  expect(toLiveCouriers(items, NOW, new Map(), NOW).map(({ state }) => state)).toEqual([
    'free',
    'offer',
  ]);
  expect(toLiveCouriers(items, NOW, new Map(), NOW + 20_000).map(({ state }) => state)).toEqual([
    'no_signal',
    'offer',
  ]);
});

test('should bring the signal back with a newer position and move the courier', () => {
  const items = [
    item(1, {
      state: 'no_signal',
      positionAgeSec: 300,
      activeOrder: { orderId: 4, status: 'picked_up' },
    }),
  ];
  const updates = new Map([[1, { lat: 53.91, lng: 27.57, seenAt: NOW + 1000 }]]);
  const [courier] = toLiveCouriers(items, NOW, updates, NOW + 2000);

  expect(courier).toMatchObject({ lat: 53.91, lng: 27.57, state: 'on_order' });
});

test('should keep the loaded position when the update is older', () => {
  const items = [item(1, { positionAgeSec: 1 })];
  const updates = new Map([[1, { lat: 1, lng: 2, seenAt: NOW - 30_000 }]]);
  const [courier] = toLiveCouriers(items, NOW, updates, NOW);

  expect(courier).toMatchObject({ lat: 53.9, lng: 27.56, seenAt: NOW - 1000 });
});

test('should move the counts of the loaded couriers to their state on the page', () => {
  const items = [
    item(1, { positionAgeSec: 50 }),
    item(2, { state: 'on_order', activeOrder: { orderId: 3, status: 'in_transit' } }),
  ];
  const live = toLiveCouriers(items, NOW, new Map(), NOW + 20_000);

  expect(liveCounts({ free: 3, offer: 1, on_order: 2, no_signal: 0 }, items, live)).toEqual({
    free: 2,
    offer: 1,
    on_order: 2,
    no_signal: 1,
  });
});
