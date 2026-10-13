import { selectZoneForPoint } from './zones.service';
import type { ZoneCandidate } from '../types/zones.types';

const SMALL_SQUARE: number[][][] = [
  [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0],
  ],
];

const LARGE_SQUARE: number[][][] = [
  [
    [0, 0],
    [0, 20],
    [20, 20],
    [20, 0],
    [0, 0],
  ],
];

const INSIDE_BOTH = { latitude: 5, longitude: 5 };
const INSIDE_LARGE_ONLY = { latitude: 15, longitude: 15 };
const OUTSIDE_ALL = { latitude: 50, longitude: 50 };
const ON_BORDER = { latitude: 5, longitude: 0 };

function buildZone(overrides: Partial<ZoneCandidate> = {}): ZoneCandidate {
  return {
    zoneId: 1,
    name: 'Small',
    tariffId: 1,
    priority: 0,
    polygon: SMALL_SQUARE,
    ...overrides,
  };
}

describe('selectZoneForPoint', () => {
  it('should return null when there are no zones', () => {
    expect(selectZoneForPoint([], INSIDE_BOTH)).toBeNull();
  });

  it('should return null when the point is outside every zone', () => {
    expect(selectZoneForPoint([buildZone()], OUTSIDE_ALL)).toBeNull();
  });

  it('should return the zone when the point is inside it', () => {
    const result = selectZoneForPoint([buildZone({ zoneId: 7, tariffId: 3 })], INSIDE_BOTH);

    expect(result).toEqual({ zoneId: 7, name: 'Small', tariffId: 3 });
  });

  it('should treat a point on the border as inside', () => {
    expect(selectZoneForPoint([buildZone()], ON_BORDER)).not.toBeNull();
  });

  it('should prefer the zone with the higher priority when zones overlap', () => {
    const small = buildZone({ zoneId: 1, name: 'Small', priority: 0 });
    const large = buildZone({ zoneId: 2, name: 'Large', priority: 5, polygon: LARGE_SQUARE });

    expect(selectZoneForPoint([small, large], INSIDE_BOTH)?.name).toBe('Large');
  });

  it('should prefer the lower zone id when priorities are equal', () => {
    const newer = buildZone({ zoneId: 9, name: 'Newer', polygon: LARGE_SQUARE });
    const older = buildZone({ zoneId: 2, name: 'Older' });

    expect(selectZoneForPoint([newer, older], INSIDE_BOTH)?.name).toBe('Older');
  });

  it('should ignore zones that do not contain the point', () => {
    const small = buildZone({ zoneId: 1, name: 'Small', priority: 10 });
    const large = buildZone({ zoneId: 2, name: 'Large', polygon: LARGE_SQUARE });

    expect(selectZoneForPoint([small, large], INSIDE_LARGE_ONLY)?.name).toBe('Large');
  });
});
