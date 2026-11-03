import { expect, test } from '@playwright/test';
import type { CourierCandidate, UnsuitableCandidate } from '@/shared/staff-api';
import {
  candidateLine,
  distanceText,
  filterCandidates,
  keepSelection,
  suitableSummary,
  unsuitableLine,
  vehicleChips,
} from './candidates';

function candidate(courierId: number, patch: Partial<CourierCandidate> = {}): CourierCandidate {
  return {
    courierId,
    name: `Курьер ${courierId}`,
    vehicleType: 'car',
    pickupDistanceM: 3400,
    positionAgeSec: 12,
    hasOpenOffer: false,
    ...patch,
  };
}

test('should count the chips of the transport from the whole list, the empty types left out', () => {
  const suitable = [
    candidate(1, { vehicleType: 'foot' }),
    candidate(2, { vehicleType: 'car' }),
    candidate(3, { vehicleType: 'car' }),
    candidate(4, { vehicleType: null }),
  ];

  expect(vehicleChips(suitable).map(({ label, count }) => [label, count])).toEqual([
    ['Все', 4],
    ['Пеший', 1],
    ['Легковой', 2],
  ]);
});

test('should filter both lists by the chosen transport', () => {
  const unsuitable: UnsuitableCandidate[] = [
    { ...candidate(5, { vehicleType: 'foot' }), reasons: ['offline'] },
  ];
  const shown = filterCandidates(
    { suitable: [candidate(1, { vehicleType: 'foot' }), candidate(2)], unsuitable },
    'car',
  );

  expect(shown.suitable.map(({ courierId }) => courierId)).toEqual([2]);
  expect(shown.unsuitable).toEqual([]);
});

test('should name every reason why a courier does not fit', () => {
  const courier: UnsuitableCandidate = {
    ...candidate(5),
    reasons: ['offline', 'stale_location', 'busy', 'vehicle_mismatch', 'no_vehicle'],
  };

  expect(unsuitableLine(courier)).toBe(
    'Не на линии, Нет связи, Везёт другой заказ, Транспорт не подходит под посылку, Нет транспорта',
  );
});

test('should describe a courier by the transport, the open offer or the age of the position', () => {
  expect(candidateLine(candidate(1))).toBe('Легковой, позиция 12 с назад');
  expect(candidateLine(candidate(1, { hasOpenOffer: true }))).toBe(
    'Легковой, есть предложение по другому заказу',
  );
  expect(distanceText(candidate(1))).toBe('3,4 км');
  expect(distanceText(candidate(1, { pickupDistanceM: null }))).toBe('–');
});

test('should count the couriers with the weight of the parcel when it is known', () => {
  expect(suitableSummary(4, 2.5)).toBe('Подходят для посылки 2,5 кг: 4 курьера');
  expect(suitableSummary(5, null)).toBe('Подходят для посылки: 5 курьеров');
});

test('should keep the chosen courier while they fit and drop them with a notice otherwise', () => {
  expect(keepSelection(2, [candidate(2)])).toEqual({ selectedId: 2, isLost: false });
  expect(keepSelection(2, [candidate(3)])).toEqual({ selectedId: null, isLost: true });
  expect(keepSelection(null, [])).toEqual({ selectedId: null, isLost: false });
});
