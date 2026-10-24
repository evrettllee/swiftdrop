import { type RefObject, useEffect, useEffectEvent, useRef, useState } from 'react';
import { IS_MAPBOX_CONFIGURED } from '@/shared/config';
import { type GeoPoint, getDistanceKm } from '@/shared/lib/geo';
import {
  METERS_PER_KM,
  ROUTE_REFRESH_DISTANCE_M,
  ROUTE_REFRESH_INTERVAL_MS,
  ROUTE_RETRY_MS,
} from './config';
import { type MapRoute, NO_ROUTE } from './map-route';
import { fetchRouteOutcome, type RouteLinesLoader, type RouteOutcome } from './route-outcome';

type RouteLinesOptions = {
  // The courier on the map: a move farther than the threshold asks for the line again.
  movingPoint?: GeoPoint | null;
  // Asks for the same route again each time it changes (the room of the order was joined again
  // after a lost connection); the lines shown stay until the answer.
  reloadToken?: number;
};

type StoredRoute = MapRoute & { key: string };
type LastRequest = { atMs: number; point: GeoPoint | null };

const NOTHING_TO_ASK: RouteOutcome = { route: NO_ROUTE, shouldRetry: false, isFinal: true };

// Asks again once the courier has moved past the threshold, but not sooner than the interval
// after the last answer.
function useMoveRefresh(
  isEnabled: boolean,
  point: GeoPoint | null,
  lastRequest: RefObject<LastRequest | null>,
  refresh: () => void,
): void {
  const latitude = point?.latitude ?? null;
  const longitude = point?.longitude ?? null;
  const onDue = useEffectEvent(refresh);

  useEffect(() => {
    const last = lastRequest.current;

    if (!isEnabled || latitude === null || longitude === null || last === null) {
      return undefined;
    }

    const movedM =
      last.point === null
        ? Infinity
        : getDistanceKm(last.point, { latitude, longitude }) * METERS_PER_KM;

    if (movedM < ROUTE_REFRESH_DISTANCE_M) {
      return undefined;
    }

    const timer = window.setTimeout(
      onDue,
      Math.max(0, last.atMs + ROUTE_REFRESH_INTERVAL_MS - Date.now()),
    );

    return () => window.clearTimeout(timer);
  }, [isEnabled, latitude, longitude, lastRequest]);
}

// The lines of a map, kept while the map is on the screen. `requestKey` names what is routed: a new
// key drops the lines of the old one at once. `load` is null when there is nothing to ask for.
export function useRouteLines(
  load: RouteLinesLoader | null,
  requestKey: string,
  { movingPoint = null, reloadToken = 0 }: RouteLinesOptions = {},
): MapRoute {
  const isEnabled = load !== null && IS_MAPBOX_CONFIGURED;
  const [attempt, setAttempt] = useState(0);
  const [stored, setStored] = useState<StoredRoute | null>(null);
  const lastRequest = useRef<LastRequest | null>(null);
  const loadRoute = useEffectEvent((signal: AbortSignal) =>
    load === null ? Promise.resolve(NOTHING_TO_ASK) : fetchRouteOutcome(load, signal),
  );
  const getMovingPoint = useEffectEvent(() => movingPoint);
  const askAgain = () => setAttempt((current) => current + 1);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();
    let timer: number | undefined;

    void loadRoute(controller.signal).then(({ route, shouldRetry, isFinal }) => {
      if (controller.signal.aborted) {
        return;
      }

      setStored({ ...route, key: requestKey });
      // A final answer leaves no last request, so a move of the courier asks for nothing either.
      lastRequest.current = isFinal ? null : { atMs: Date.now(), point: getMovingPoint() };

      if (shouldRetry) {
        timer = window.setTimeout(() => setAttempt((current) => current + 1), ROUTE_RETRY_MS);
      }
    });

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isEnabled, requestKey, attempt, reloadToken]);

  useMoveRefresh(isEnabled, movingPoint, lastRequest, askAgain);

  return isEnabled && stored?.key === requestKey ? stored : NO_ROUTE;
}
