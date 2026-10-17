import { useEffect, useEffectEvent } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import { watchDevicePosition } from '../lib/watch-position';

type PositionWatchHandlers = {
  onPosition: (point: GeoPoint) => void;
  onDenied: () => void;
  // Called every `intervalMs`, to send the last position.
  onTick: () => void;
};

// Follows the device while `isActive` (lib/watch-position): the last position keeps going while it
// is fresh. Every new visit of the line starts a new watch, precise again.
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

    const stopWatch = watchDevicePosition({
      onPosition: (point) => handlePosition(point),
      onDenied: () => handleDenied(),
    });
    const timer = window.setInterval(() => handleTick(), intervalMs);

    return () => {
      stopWatch();
      window.clearInterval(timer);
    };
  }, [isActive, intervalMs]);
}
