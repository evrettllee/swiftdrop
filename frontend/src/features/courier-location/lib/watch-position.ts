import type { GeoPoint } from '@/shared/lib/geo';
import {
  GEO_PROBLEM,
  WATCH_FALLBACK_POSITION_OPTIONS,
  WATCH_POSITION_OPTIONS,
} from '../config/geolocation';
import { toGeoPoint, toGeoProblem, waitAfterDenial } from './geolocation';

type WatchHandlers = {
  onPosition: (point: GeoPoint) => void;
  onDenied: () => void;
};

// Follows the device precisely, and roughly when the precise watch times out before its first
// position (a device without GPS). Other gaps are not errors here. A denial is final, unless the
// browser allows the position (waitAfterDenial). Returns the function that stops the watch.
export function watchDevicePosition({ onPosition, onDenied }: WatchHandlers): () => void {
  const { geolocation } = navigator;
  let isPrecise = true;
  // A device that has sent a precise position has GPS: its later timeouts are only pauses.
  let hasPrecisePoint = false;
  // When the precise watch times out without a position.
  const preciseDeadline = Date.now() + (WATCH_POSITION_OPTIONS.timeout ?? 0);
  // Waiting for the position after a denial the browser does not confirm.
  let stopWaiting: (() => void) | null = null;
  let watchId = start(WATCH_POSITION_OPTIONS);

  function stopWaitingAfterDenial(): void {
    stopWaiting?.();
    stopWaiting = null;
  }

  function switchToRough(): void {
    stopWaitingAfterDenial();
    isPrecise = false;
    geolocation.clearWatch(watchId);
    watchId = start(WATCH_FALLBACK_POSITION_OPTIONS);
  }

  function start(options: PositionOptions): number {
    return geolocation.watchPosition(
      (position) => {
        stopWaitingAfterDenial();
        hasPrecisePoint ||= isPrecise;
        onPosition(toGeoPoint(position));
      },
      (error) => {
        const isFirstPreciseTry = isPrecise && !hasPrecisePoint;

        if (toGeoProblem(error) === GEO_PROBLEM.DENIED) {
          // Other gaps have no timeout: the watch waits for the position without a limit.
          stopWaiting ??= waitAfterDenial({
            onDenied,
            deadline: isFirstPreciseTry ? preciseDeadline : null,
            onTimeout: switchToRough,
          });
        } else if (isFirstPreciseTry && error.code === error.TIMEOUT) {
          switchToRough();
        }
      },
      options,
    );
  }

  return () => {
    stopWaitingAfterDenial();
    geolocation.clearWatch(watchId);
  };
}
