import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { COURIER_LOCATION_STALE_MS } from '../constants/deliveries.constants';
import type { ClientCourierPositionRow } from '../types/deliveries.types';
import { isPositionStale, toClientCourierPosition } from './courier-position';

const UPDATED_AT = new Date('2026-10-22T12:00:00Z');

const ROW: ClientCourierPositionRow = {
  status: ORDER_STATUS.IN_TRANSIT,
  currentLat: 53.92,
  currentLng: 27.6,
  locationUpdatedAt: UPDATED_AT,
  positionAgeMs: 1_000,
};

describe('isPositionStale', () => {
  it('should keep the connection at exactly 60 000 ms', () => {
    expect(COURIER_LOCATION_STALE_MS).toBe(60_000);
    expect(isPositionStale(60_000)).toBe(false);
  });

  it('should count the connection lost at 60 001 ms', () => {
    expect(isPositionStale(60_001)).toBe(true);
  });
});

describe('toClientCourierPosition', () => {
  it('should give the position with the time of the database while the order is active', () => {
    expect(toClientCourierPosition(ROW)).toEqual({
      latitude: ROW.currentLat,
      longitude: ROW.currentLng,
      updatedAt: UPDATED_AT.toISOString(),
      isStale: false,
    });
  });

  it('should give an old position too, marked stale', () => {
    expect(toClientCourierPosition({ ...ROW, positionAgeMs: 10 * 60_000 })?.isStale).toBe(true);
  });

  it.each([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.CONFIRMED])(
    'should give no position when the order is %s',
    (status) => {
      expect(toClientCourierPosition({ ...ROW, status })).toBeNull();
    },
  );

  it('should give no position before the first one', () => {
    const empty = {
      ...ROW,
      currentLat: null,
      currentLng: null,
      locationUpdatedAt: null,
      positionAgeMs: null,
    };

    expect(toClientCourierPosition(empty)).toBeNull();
  });
});
