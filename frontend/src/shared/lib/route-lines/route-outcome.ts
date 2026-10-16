import {
  ApiError,
  HTTP_STATUS,
  type HttpOptions,
  NETWORK_ERROR_STATUS,
  type RouteLines,
  SERVER_ERROR_STATUS_MIN,
} from '@/shared/api';
import { type MapRoute, NO_ROUTE, toMapRoute, UNAVAILABLE_ROUTE } from './map-route';

export type RouteLinesLoader = (options: HttpOptions) => Promise<RouteLines>;

// What a map draws after an answer, and what it does next.
export type RouteOutcome = {
  route: MapRoute;
  // A missing line that may come later: the request is repeated after ROUTE_RETRY_MS.
  shouldRetry: boolean;
  // Nothing more to ask for: no retry, no refresh, no new request when the courier moves.
  isFinal: boolean;
};

// The offer is closed, the order is not the user's or the session is over: there is no route to
// wait for and nothing failed, so the map shows the points alone, without the badge.
const FINAL_STATUSES: readonly number[] = [
  HTTP_STATUS.UNAUTHORIZED,
  HTTP_STATUS.FORBIDDEN,
  HTTP_STATUS.NOT_FOUND,
];

function isTransient(status: number): boolean {
  return (
    status === NETWORK_ERROR_STATUS ||
    status === HTTP_STATUS.TOO_MANY_REQUESTS ||
    status >= SERVER_ERROR_STATUS_MIN
  );
}

function toFailureOutcome(error: unknown): RouteOutcome {
  // An answer the schema does not accept is a failure of the server as well.
  const status = error instanceof ApiError ? error.status : SERVER_ERROR_STATUS_MIN;

  if (FINAL_STATUSES.includes(status)) {
    return { route: NO_ROUTE, shouldRetry: false, isFinal: true };
  }

  // A transient failure (the network, a limit, the server) is asked again; a refused request (points
  // outside the service area) would be refused again, so the badge stays without a retry.
  const shouldRetry = isTransient(status);

  return { route: UNAVAILABLE_ROUTE, shouldRetry, isFinal: !shouldRetry };
}

export async function fetchRouteOutcome(
  load: RouteLinesLoader,
  signal: AbortSignal,
): Promise<RouteOutcome> {
  try {
    const route = toMapRoute(await load({ signal }));

    // A segment without its line (the routing service is down, no fresh courier) may come later.
    return { route, shouldRetry: route.isUnavailable, isFinal: false };
  } catch (error) {
    return toFailureOutcome(error);
  }
}
