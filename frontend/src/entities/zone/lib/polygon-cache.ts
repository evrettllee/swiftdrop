import type { GeoPoint } from '@/shared/lib/geo';
import type { ManagerZone } from '@/shared/staff-api';

export type PolygonCache = ReadonlyMap<string, readonly GeoPoint[]>;

export function zoneCacheKey({ id, updatedAt }: Pick<ManagerZone, 'id' | 'updatedAt'>): string {
  return `${id}:${updatedAt}`;
}

export function zonesToLoad(
  zones: readonly ManagerZone[],
  known: ReadonlySet<string>,
): ManagerZone[] {
  return zones.filter((zone) => !known.has(zoneCacheKey(zone)));
}

export function ringOf(zone: ManagerZone, cache: PolygonCache): readonly GeoPoint[] | null {
  return cache.get(zoneCacheKey(zone)) ?? null;
}
