import { expect, test } from '@playwright/test';
import type { ManagerZone } from '@/shared/staff-api';
import { ringOf, zoneCacheKey, zonesToLoad } from './polygon-cache';
import { toRing } from './zone-ring';

function zone(id: number, updatedAt: string): ManagerZone {
  return {
    id,
    name: `Зона ${id}`,
    tariff: { id: 1, name: 'Минск, стандарт' },
    priority: 0,
    isActive: true,
    vertexCount: 4,
    areaKm2: 12.4,
    updatedAt,
  };
}

const RING = [
  { latitude: 53.9, longitude: 27.5 },
  { latitude: 53.95, longitude: 27.6 },
];

test('should key the polygon by the zone and the time of its change', () => {
  expect(zoneCacheKey(zone(3, '2026-10-20T10:00:00.000Z'))).toBe('3:2026-10-20T10:00:00.000Z');
});

test('should load only the zones whose version is not known yet', () => {
  const first = zone(1, '2026-10-20T10:00:00.000Z');
  const changed = zone(2, '2026-10-21T10:00:00.000Z');
  const known = new Set([zoneCacheKey(first), zoneCacheKey(zone(2, '2026-10-20T10:00:00.000Z'))]);

  expect(zonesToLoad([first, changed, zone(3, 'x')], known).map(({ id }) => id)).toEqual([2, 3]);
});

test('should give the ring of the same version only', () => {
  const cache = new Map([[zoneCacheKey(zone(1, 'a')), RING]]);

  expect(ringOf(zone(1, 'a'), cache)).toBe(RING);
  expect(ringOf(zone(1, 'b'), cache)).toBeNull();
});

test('should read the outer ring of GeoJSON without the closing point', () => {
  expect(
    toRing([
      [
        [27.5, 53.9],
        [27.6, 53.95],
        [27.55, 53.92],
        [27.5, 53.9],
      ],
    ]),
  ).toEqual([
    { latitude: 53.9, longitude: 27.5 },
    { latitude: 53.95, longitude: 27.6 },
    { latitude: 53.92, longitude: 27.55 },
  ]);
});
