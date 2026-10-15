import { useCallback, useEffect, useRef, useState } from 'react';
import { refreshCourierProfile } from '@/entities/courier';
import { MS_PER_SECOND } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { LOCATION_UPDATE_REJECTION, sendCourierLocation } from '@/shared/realtime';
import { WATCH_POSITION_OPTIONS } from '../config/geolocation';
import { toGeoPoint } from '../lib/geolocation';

// The backend takes one position per 15 seconds from a socket (LOCATION_MIN_INTERVAL_MS in
// backend/src/modules/couriers/constants/couriers-socket.constants.ts) and measures it by the time
// a position arrives. One second more keeps the network jitter from making it "too frequent".
const LOCATION_SEND_INTERVAL_MS = 16 * MS_PER_SECOND;

// Sends the last position of the device while `isSharing` (on the line with a connected socket),
// one per interval. `point` is the last position the backend took, for the map. `sendNow` sends a
// position at once (going on the line); without it the first position of the device goes at once.
export function useLocationSharing(isSharing: boolean) {
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const latest = useRef<GeoPoint | null>(null);
  // Null until a position was sent on this visit of the line.
  const lastSentAt = useRef<number | null>(null);

  const sendNow = useCallback(async (sent: GeoPoint): Promise<void> => {
    latest.current = sent;
    lastSentAt.current = Date.now();
    const ack = await sendCourierLocation(sent);

    // too_frequent, busy, invalid_location and unavailable are skipped: the next position goes
    // on schedule. session_expired is handled by the socket itself (shared/realtime).
    if (ack?.ok === true) {
      setPoint(sent);
    } else if (ack?.ok === false && ack.reason === LOCATION_UPDATE_REJECTION.OFF_SHIFT) {
      // The backend counts the courier off the line: the profile tells the page so.
      void refreshCourierProfile();
    }
  }, []);

  // Off the line: the next visit starts with a new position, not the old one.
  const reset = useCallback(() => {
    latest.current = null;
    lastSentAt.current = null;
    setPoint(null);
  }, []);

  useEffect(() => {
    if (!isSharing || !('geolocation' in navigator)) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        latest.current = toGeoPoint(position);

        if (lastSentAt.current === null) {
          void sendNow(latest.current);
        }
      },
      () => {
        // The last known position keeps being sent until the device finds a new one.
      },
      WATCH_POSITION_OPTIONS,
    );
    const timer = window.setInterval(() => {
      if (latest.current !== null) {
        void sendNow(latest.current);
      }
    }, LOCATION_SEND_INTERVAL_MS);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(timer);
    };
  }, [isSharing, sendNow]);

  return { point, sendNow, reset };
}
