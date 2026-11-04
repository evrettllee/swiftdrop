import { useCallback, useEffect, useState } from 'react';
import { SOCKET_EVENTS, type TypedSocketEvent, useSocketEventBatch } from '@/shared/realtime';
import { getManagerZones, type ManagerZone } from '@/shared/staff-api';

const ZONE_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.STAFF_ZONE];

type ZonesAnswer = { attempt: number; zones: ManagerZone[] | null; isFailed: boolean };

export function useZones() {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<ZonesAnswer | null>(null);
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    getManagerZones({ signal: controller.signal }).then(
      (zones) => setAnswer({ attempt, zones, isFailed: false }),
      () => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({ attempt, zones: previous?.zones ?? null, isFailed: true }));
        }
      },
    );

    return () => controller.abort();
  }, [attempt]);

  useSocketEventBatch(ZONE_EVENTS, reload);

  return {
    zones: answer?.zones ?? null,
    isFailed: answer?.isFailed === true,
    reload,
  };
}
