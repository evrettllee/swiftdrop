import { useEffect, useRef, useState } from 'react';
import { runLimited } from '@/shared/lib/async';
import { getManagerZone, type ManagerZone } from '@/shared/staff-api';
import { POLYGON_LOAD_LIMIT } from '../config/zones';
import { type PolygonCache, zoneCacheKey, zonesToLoad } from '../lib/polygon-cache';
import { toRing } from '../lib/zone-ring';

const NO_ZONES: readonly ManagerZone[] = [];

export function useZonePolygons(zones: readonly ManagerZone[] | null) {
  const list = zones ?? NO_ZONES;
  const [cache, setCache] = useState<PolygonCache>(() => new Map());
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const known = useRef(new Set<string>());

  useEffect(() => {
    const knownKeys = known.current;
    const toLoad = zonesToLoad(list, knownKeys);

    if (toLoad.length === 0) {
      return undefined;
    }

    const keys = toLoad.map(zoneCacheKey);
    const settled = new Set<string>();
    keys.forEach((key) => knownKeys.add(key));
    const controller = new AbortController();
    const tasks = toLoad.map(
      (zone) => (signal: AbortSignal) => getManagerZone(zone.id, { signal }),
    );

    void runLimited(tasks, POLYGON_LOAD_LIMIT, controller.signal, (index, result) => {
      const key = keys[index];
      settled.add(key);

      if (result.ok) {
        const ring = toRing(result.value.polygon);
        setCache((previous) => new Map(previous).set(key, ring));
      } else {
        setFailed((previous) => new Set(previous).add(key));
      }
    });

    return () => {
      controller.abort();
      keys.filter((key) => !settled.has(key)).forEach((key) => knownKeys.delete(key));
    };
  }, [list]);

  const isSettled = list.every((zone) => {
    const key = zoneCacheKey(zone);

    return cache.has(key) || failed.has(key);
  });

  return { cache, isSettled };
}
