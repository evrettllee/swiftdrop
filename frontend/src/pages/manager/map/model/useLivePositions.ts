import { useEffect, useEffectEvent, useState } from 'react';
import { onTypedSocketEvent, SOCKET_EVENTS } from '@/shared/realtime';
import type { PositionUpdate } from '../lib/live-couriers';

export function useLivePositions(
  loadedIds: ReadonlySet<number>,
): ReadonlyMap<number, PositionUpdate> {
  const [updates, setUpdates] = useState<ReadonlyMap<number, PositionUpdate>>(() => new Map());
  const isLoaded = useEffectEvent((courierId: number) => loadedIds.has(courierId));

  useEffect(
    () =>
      onTypedSocketEvent(SOCKET_EVENTS.STAFF_COURIER_LOCATION, ({ courierId, lat, lng }) => {
        if (isLoaded(courierId)) {
          setUpdates((previous) =>
            new Map(previous).set(courierId, { lat, lng, seenAt: Date.now() }),
          );
        }
      }),
    [],
  );

  return updates;
}
