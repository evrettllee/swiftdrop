import { useMemo } from 'react';
import { useNow } from '@/shared/lib/clock';
import type { GeoPoint } from '@/shared/lib/geo';
import { NO_SIGNAL_TICK_MS, type MapFilter } from '../config/map';
import { filterChips, isInFilter, liveCounts } from '../lib/courier-state';
import { toLiveCouriers } from '../lib/live-couriers';
import type { MapAnswer } from './useCouriersMap';
import { useLivePositions } from './useLivePositions';

const NO_IDS: ReadonlySet<number> = new Set();

export function useLiveCouriers(answer: MapAnswer | null, filter: MapFilter | null) {
  const data = answer?.data ?? null;
  const receivedAt = answer?.receivedAt ?? 0;
  const now = Math.max(useNow(NO_SIGNAL_TICK_MS), receivedAt);
  const loadedIds = useMemo(
    () => (data === null ? NO_IDS : new Set(data.items.map(({ courierId }) => courierId))),
    [data],
  );
  const updates = useLivePositions(loadedIds);
  const couriers = useMemo(
    () => (data === null ? [] : toLiveCouriers(data.items, receivedAt, updates, now)),
    [data, receivedAt, updates, now],
  );
  const shown = useMemo(
    () => couriers.filter((courier) => isInFilter(courier.state, filter)),
    [couriers, filter],
  );
  const fitPoints = useMemo(
    () =>
      shown.flatMap(({ lat, lng }): GeoPoint[] =>
        lat === null || lng === null ? [] : [{ latitude: lat, longitude: lng }],
      ),
    [shown],
  );

  return {
    now,
    shown,
    fitPoints,
    chips: data === null ? null : filterChips(liveCounts(data.counts, data.items, couriers)),
  };
}
