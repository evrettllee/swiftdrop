import { useMemo } from 'react';
import { type Neighbor, ringOf, useZonePolygons, useZones } from '@/entities/zone';
import type { GeoPoint } from '@/shared/lib/geo';

export function useNeighbors(exceptId: number | null) {
  const { zones } = useZones();
  const { cache, isSettled } = useZonePolygons(zones);
  const neighbors = useMemo(
    () =>
      (zones ?? []).flatMap((zone): Neighbor[] => {
        const ring = ringOf(zone, cache);

        return zone.id === exceptId || ring === null ? [] : [{ zone, ring }];
      }),
    [zones, cache, exceptId],
  );
  const points = useMemo(
    (): readonly GeoPoint[] => (isSettled ? neighbors.flatMap(({ ring }) => ring) : []),
    [neighbors, isSettled],
  );

  return { neighbors, points, isSettled: zones !== null && isSettled };
}
