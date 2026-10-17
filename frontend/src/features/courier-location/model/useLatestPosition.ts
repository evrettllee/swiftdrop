import { useCallback, useRef, useState } from 'react';
import { setCourierPosition } from '@/entities/courier';
import type { GeoPoint } from '@/shared/lib/geo';
import { GEO_PROBLEM, type GeoProblem, POSITION_FRESH_MS } from '../config/geolocation';

// A position of the device and when the page received it: the backend counts its freshness from
// the moment it arrives too, not from when the device found it.
type ReceivedPoint = {
  point: GeoPoint;
  receivedAt: number;
};

// The last position of the device on the line, and why there is none to send (`problem`): denied,
// or nothing new for POSITION_FRESH_MS.
export function useLatestPosition() {
  const [problem, setProblem] = useState<GeoProblem | null>(null);
  const latest = useRef<ReceivedPoint | null>(null);

  const receive = useCallback((point: GeoPoint) => {
    latest.current = { point, receivedAt: Date.now() };
    setCourierPosition(point);
    setProblem(null);
  }, []);

  // The last position while it is fresh. An old one is not sent: the courier is told instead.
  const takeFresh = useCallback((): GeoPoint | null => {
    const current = latest.current;

    if (current !== null && Date.now() - current.receivedAt > POSITION_FRESH_MS) {
      setProblem((shown) => shown ?? GEO_PROBLEM.FAILED);

      return null;
    }

    return current?.point ?? null;
  }, []);

  const clear = useCallback(() => {
    latest.current = null;
    setProblem(null);
    setCourierPosition(null);
  }, []);

  return { problem, setProblem, receive, takeFresh, clear };
}
