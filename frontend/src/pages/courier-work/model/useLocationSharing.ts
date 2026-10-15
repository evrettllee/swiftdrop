import { useCallback, useRef, useState } from 'react';
import { refreshCourierProfile } from '@/entities/courier';
import { MS_PER_SECOND } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import {
  type LocationAck,
  LOCATION_UPDATE_REJECTION,
  sendCourierLocation,
} from '@/shared/realtime';
import { GEO_PROBLEM } from '../config/geolocation';
import { getCurrentPoint } from '../lib/geolocation';
import { useLatestPosition } from './useLatestPosition';
import { usePositionWatch } from './usePositionWatch';

// The backend takes one position per 15 seconds from a socket (LOCATION_MIN_INTERVAL_MS in
// backend/src/modules/couriers/constants/couriers-socket.constants.ts) and measures it by the time
// a position arrives. One second more keeps the network jitter from making it "too frequent".
const LOCATION_SEND_INTERVAL_MS = 16 * MS_PER_SECOND;

// True when the backend took the position. too_frequent, busy, invalid_location and unavailable are
// skipped: the next position goes on schedule. session_expired is handled by the socket itself
// (shared/realtime). off_shift: the backend counts the courier off the line, the profile says so.
function isAccepted(ack: LocationAck | null): boolean {
  if (ack?.ok === false && ack.reason === LOCATION_UPDATE_REJECTION.OFF_SHIFT) {
    void refreshCourierProfile();
  }

  return ack?.ok === true;
}

// Sends the last position of the device while `isSharing` (on the line with a connected socket),
// one per interval. `point` is the last position the backend took, for the map. `sendNow` sends a
// position at once (going on the line); without it the first position of the device goes at once.
// `problem` tells that the position is lost; `recheck` is «Проверить ещё раз» on the line.
export function useLocationSharing(isSharing: boolean) {
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { problem, setProblem, receive, takeFresh, clear } = useLatestPosition();
  // Null until a position was sent on this visit of the line.
  const lastSentAt = useRef<number | null>(null);

  const sendLatest = useCallback(async (): Promise<void> => {
    const fresh = takeFresh();

    if (fresh === null) {
      return;
    }

    lastSentAt.current = Date.now();

    if (isAccepted(await sendCourierLocation(fresh))) {
      setPoint(fresh);
    }
  }, [takeFresh]);

  const sendNow = useCallback(
    async (sent: GeoPoint): Promise<void> => {
      receive(sent);
      await sendLatest();
    },
    [receive, sendLatest],
  );

  // The same two tries as going on the line.
  const recheck = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    const found = await getCurrentPoint();

    if (typeof found === 'string') {
      setProblem(found);
    } else {
      await sendNow(found);
    }

    setIsChecking(false);
  }, [sendNow, setProblem]);

  usePositionWatch(isSharing, LOCATION_SEND_INTERVAL_MS, {
    onPosition: (received) => {
      receive(received);

      if (lastSentAt.current === null) {
        void sendLatest();
      }
    },
    onDenied: () => setProblem(GEO_PROBLEM.DENIED),
    onTick: () => void sendLatest(),
  });

  // Off the line: the next visit starts with a new position, not the old one.
  const reset = useCallback(() => {
    lastSentAt.current = null;
    setPoint(null);
    clear();
  }, [clear]);

  return { point, problem, isChecking, sendNow, recheck, reset };
}
