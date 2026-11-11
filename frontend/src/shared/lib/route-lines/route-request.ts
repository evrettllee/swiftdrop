import type { RouteOutcome } from './route-outcome';

export function settledRouteKey(
  { isFinal }: Pick<RouteOutcome, 'isFinal'>,
  requestKey: string,
): string | null {
  return isFinal ? requestKey : null;
}

export function shouldAskRoute(settledKey: string | null, requestKey: string): boolean {
  return settledKey !== requestKey;
}
