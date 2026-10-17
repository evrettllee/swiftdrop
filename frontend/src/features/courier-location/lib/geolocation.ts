import type { GeoPoint } from '@/shared/lib/geo';
import {
  FALLBACK_POSITION_OPTIONS,
  FIRST_POSITION_OPTIONS,
  GEO_PROBLEM,
  type GeoProblem,
} from '../config/geolocation';

export function toGeoPoint(position: GeolocationPosition): GeoPoint {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

// A denial is the courier's answer: asking again does not change it.
export function toGeoProblem(error: GeolocationPositionError): GeoProblem {
  return error.code === error.PERMISSION_DENIED ? GEO_PROBLEM.DENIED : GEO_PROBLEM.FAILED;
}

// Whether the browser itself allows the position to the page. Without the Permissions API, or when
// it fails, the answer is no.
async function isPositionAllowed(): Promise<boolean> {
  if (!('permissions' in navigator)) {
    return false;
  }

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });

    return status.state === 'granted';
  } catch {
    return false;
  }
}

type DenialHandlers = {
  // The browser confirms the denial.
  onDenied: () => void;
  // The browser allows the position, but none came by `deadline` (a time of Date.now()): the same as
  // a timeout of the try. Null waits without a limit.
  deadline: number | null;
  onTimeout: () => void;
};

// An extension that changes the position (a VPN) answers PERMISSION_DENIED first and its position
// right after, while the browser allows the position. Such a denial is not the courier's answer:
// the try waits for the position until its own timeout. Returns the function that stops waiting,
// to call when the position comes or the try ends.
export function waitAfterDenial({ onDenied, deadline, onTimeout }: DenialHandlers): () => void {
  let isWaiting = true;
  const timer =
    deadline === null
      ? undefined
      : window.setTimeout(
          () => {
            isWaiting = false;
            onTimeout();
          },
          Math.max(deadline - Date.now(), 0),
        );

  function stop(): void {
    isWaiting = false;
    window.clearTimeout(timer);
  }

  void isPositionAllowed().then((isAllowed) => {
    if (isWaiting && !isAllowed) {
      stop();
      onDenied();
    }
  });

  return stop;
}

function requestPosition(options: PositionOptions): Promise<GeoPoint | GeoProblem> {
  const deadline = Date.now() + (options.timeout ?? 0);

  return new Promise((resolve) => {
    let stopWaiting: (() => void) | null = null;
    let isDone = false;

    function finish(result: GeoPoint | GeoProblem): void {
      if (!isDone) {
        isDone = true;
        stopWaiting?.();
        resolve(result);
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => finish(toGeoPoint(position)),
      (error) => {
        if (isDone || stopWaiting !== null) {
          return;
        }

        if (toGeoProblem(error) === GEO_PROBLEM.DENIED) {
          stopWaiting = waitAfterDenial({
            onDenied: () => finish(GEO_PROBLEM.DENIED),
            deadline,
            onTimeout: () => finish(GEO_PROBLEM.FAILED),
          });
        } else {
          finish(GEO_PROBLEM.FAILED);
        }
      },
      options,
    );
  });
}

// The position of the device, or the reason there is none. A timeout or no position of the precise
// try is followed by a rough one; a denial is final.
export async function getCurrentPoint(): Promise<GeoPoint | GeoProblem> {
  if (!('geolocation' in navigator)) {
    return GEO_PROBLEM.FAILED;
  }

  const result = await requestPosition(FIRST_POSITION_OPTIONS);

  return result === GEO_PROBLEM.FAILED ? requestPosition(FALLBACK_POSITION_OPTIONS) : result;
}
