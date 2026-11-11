import { expect, test } from '@playwright/test';
import { type ClientOrderRoute, ORDER_STATUS, ROUTE_SEGMENT_KIND } from '@/shared/api';
import { COURIER_LEG_TARGET } from '@/shared/realtime';
import { FakeClock } from '@/shared/lib/clock';
import { COURIER_POSITION_STALE_MS } from '../config/tracking';
import { OrderTracking } from './order-tracking';

const START_MS = Date.parse('2026-10-24T12:00:00Z');
const POINT = { latitude: 53.9, longitude: 27.55 };
const LEG = { geometry: 'leg', toPoint: COURIER_LEG_TARGET.PICKUP };

function at(offsetMs: number): Date {
  return new Date(START_MS + offsetMs);
}

function route(courierPosition: ClientOrderRoute['courierPosition']): ClientOrderRoute {
  return {
    segments: [{ kind: ROUTE_SEGMENT_KIND.TO_PICKUP, geometry: 'rest-leg' }],
    courierPosition,
    pickupEtaAt: at(7 * 60_000),
  };
}

function assigned(clock = new FakeClock(START_MS)): {
  tracking: OrderTracking;
  clock: FakeClock;
} {
  const tracking = new OrderTracking(clock);
  tracking.applyStatus(ORDER_STATUS.COURIER_ASSIGNED, at(30 * 60_000));

  return { tracking, clock };
}

test.describe('the end of the order', () => {
  for (const status of [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED]) {
    test(`should drop the courier and their events once the order is ${status}`, () => {
      const { tracking } = assigned();
      tracking.applyLocation(POINT, at(0));

      tracking.applyStatus(status, null);
      tracking.applyLocation({ latitude: 53.95, longitude: 27.6 }, at(5_000));
      tracking.applyEta(at(60 * 60_000), LEG, at(10 * 60_000));
      tracking.applyStatus(ORDER_STATUS.IN_TRANSIT, null);

      expect(tracking.getState()).toMatchObject({
        status,
        courierPosition: null,
        courierLeg: null,
        pickupEtaAt: null,
        estimatedDeliveryAt: null,
      });
    });
  }
});

test('should keep the newer position when an older one comes later', () => {
  const { tracking } = assigned();
  const newer = { latitude: 53.91, longitude: 27.56 };

  tracking.applyLocation(newer, at(10_000));
  tracking.applyLocation(POINT, at(4_000));
  tracking.applyRoute(route({ ...POINT, updatedAt: at(10_000), isStale: false }));

  expect(tracking.getState().courierPosition).toEqual({ ...newer, updatedAt: at(10_000) });
});

test('should mark the connection lost a minute after the last position came', () => {
  const { tracking, clock } = assigned();
  tracking.applyLocation(POINT, at(0));

  clock.advance(COURIER_POSITION_STALE_MS - 1);
  expect(tracking.getState().isPositionStale).toBe(false);
  clock.advance(1);
  expect(tracking.getState().isPositionStale).toBe(true);

  tracking.applyLocation(POINT, at(COURIER_POSITION_STALE_MS));
  expect(tracking.getState()).toMatchObject({
    isPositionStale: false,
    positionReceivedAt: START_MS + COURIER_POSITION_STALE_MS,
  });
});

test('should take the stale mark of the route and count the rest of a fresh one', () => {
  const stale = assigned();
  stale.tracking.applyRoute(route({ ...POINT, updatedAt: at(-90_000), isStale: true }));
  expect(stale.tracking.getState().isPositionStale).toBe(true);

  // 50 seconds old when the page got it: 10 seconds left.
  const fresh = assigned();
  fresh.tracking.applyRoute(route({ ...POINT, updatedAt: at(-50_000), isStale: false }));
  fresh.clock.advance(9_999);
  expect(fresh.tracking.getState().isPositionStale).toBe(false);
  fresh.clock.advance(1);
  expect(fresh.tracking.getState().isPositionStale).toBe(true);
});

test('should stop counting once the order is over', () => {
  const { tracking, clock } = assigned();
  tracking.applyLocation(POINT, at(0));

  tracking.applyStatus(ORDER_STATUS.DELIVERED, null);
  clock.advance(2 * COURIER_POSITION_STALE_MS);

  expect(tracking.getState().isPositionStale).toBe(false);
});

test('should forget the arrival at the pickup point and its line after the pickup', () => {
  const { tracking } = assigned();
  tracking.applyEta(at(30 * 60_000), LEG, at(7 * 60_000));

  tracking.applyStatus(ORDER_STATUS.PICKED_UP, at(25 * 60_000));

  expect(tracking.getState()).toMatchObject({ pickupEtaAt: null, courierLeg: null });
});

test('should forget the position and the line of the previous courier', () => {
  const { tracking } = assigned();
  tracking.applyRoute(route({ ...POINT, updatedAt: at(0), isStale: false }));

  tracking.applyCourierChange();

  expect(tracking.getState()).toMatchObject({
    status: ORDER_STATUS.COURIER_ASSIGNED,
    courierLeg: null,
    pickupEtaAt: null,
    courierPosition: null,
    isPositionStale: false,
  });

  tracking.applyLocation(POINT, at(-60_000));
  expect(tracking.getState().courierPosition).toEqual({ ...POINT, updatedAt: at(-60_000) });
});
