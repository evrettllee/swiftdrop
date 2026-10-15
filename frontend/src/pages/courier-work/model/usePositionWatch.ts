import { useEffect, useEffectEvent } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import {
  GEO_PROBLEM,
  WATCH_FALLBACK_POSITION_OPTIONS,
  WATCH_POSITION_OPTIONS,
} from '../config/geolocation';
import { toGeoPoint, toGeoProblem } from '../lib/geolocation';

type PositionWatchHandlers = {
  onPosition: (point: GeoPoint) => void;
  onDenied: () => void;
  // Called every `intervalMs`, to send the last position.
  onTick: () => void;
};

// Follows the device while `isActive`: precisely, and roughly when the precise watch times out before
// its first position (a device without GPS). Other gaps are not errors here: the last position keeps going while
// it is fresh. A denial is final.
export function usePositionWatch(
  isActive: boolean,
  intervalMs: number,
  { onPosition, onDenied, onTick }: PositionWatchHandlers,
): void {
  const handlePosition = useEffectEvent(onPosition);
  const handleDenied = useEffectEvent(onDenied);
  const handleTick = useEffectEvent(onTick);

  useEffect(() => {
    if (!isActive || !('geolocation' in navigator)) {
      return undefined;
    }

    const { geolocation } = navigator;
    let isPrecise = true;
    // A device that has sent a precise position has GPS: its later timeouts are only pauses.
    // Starts false on every new visit of the line, as the effect runs again.
    let hasPrecisePoint = false;
    let watchId = start(WATCH_POSITION_OPTIONS);

    function start(options: PositionOptions): number {
      return geolocation.watchPosition(
        (position) => {
          hasPrecisePoint ||= isPrecise;
          handlePosition(toGeoPoint(position));
        },
        (error) => {
          if (toGeoProblem(error) === GEO_PROBLEM.DENIED) {
            handleDenied();
          } else if (isPrecise && !hasPrecisePoint && error.code === error.TIMEOUT) {
            isPrecise = false;
            geolocation.clearWatch(watchId);
            watchId = start(WATCH_FALLBACK_POSITION_OPTIONS);
          }
        },
        options,
      );
    }

    const timer = window.setInterval(() => handleTick(), intervalMs);

    return () => {
      geolocation.clearWatch(watchId);
      window.clearInterval(timer);
    };
  }, [isActive, intervalMs]);
}
