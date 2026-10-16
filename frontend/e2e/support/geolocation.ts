import type { Page } from '@playwright/test';
import type { GeoPoint } from '../../src/shared/lib/geo/geo-point';

// Denies the position to the page, as a courier who refused it in the browser: the geolocation of
// the page answers every request with PERMISSION_DENIED, and the permission of the browser is
// denied too. Takes effect from the next load.
export async function denyGeolocation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const PERMISSION_DENIED = 1;
    const denial = {
      code: PERMISSION_DENIED,
      message: 'User denied Geolocation',
      PERMISSION_DENIED,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success: unknown, error?: (failure: typeof denial) => void) =>
          error?.(denial),
        watchPosition: (_success: unknown, error?: (failure: typeof denial) => void) => {
          error?.(denial);
          return 0;
        },
        clearWatch: () => undefined,
      },
    });
    Object.defineProperty(navigator, 'permissions', {
      value: { query: () => Promise.resolve({ state: 'denied' }) },
    });
  });
}

// An extension that changes the position (a VPN): every request and watch is answered with
// PERMISSION_DENIED first and with the position right after, while the browser allows the position.
// Takes effect from the next load.
export async function stubGeolocationExtension(page: Page, point: GeoPoint): Promise<void> {
  await page.addInitScript((found) => {
    const PERMISSION_DENIED = 1;
    const position = { coords: { ...found, accuracy: 10 }, timestamp: Date.now() };
    const denial = {
      code: PERMISSION_DENIED,
      message: 'User denied Geolocation',
      PERMISSION_DENIED,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };
    type Success = (answer: typeof position) => void;
    type Failure = (answer: typeof denial) => void;
    // The position comes a little after the denial, as from an extension.
    const POSITION_DELAY_MS = 300;

    function answer(success: Success, error: Failure): void {
      error(denial);
      setTimeout(() => success(position), POSITION_DELAY_MS);
    }

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: answer,
        watchPosition: (success: Success, error: Failure) => {
          answer(success, error);
          return 1;
        },
        clearWatch: () => undefined,
      },
    });
    Object.defineProperty(navigator, 'permissions', {
      value: { query: () => Promise.resolve({ state: 'granted' }) },
    });
  }, point);
}

// Where the stub below keeps the accuracy of every watch the page started, in order.
const WATCH_MODES_KEY = 'e2eGeolocationWatchModes';

// What the precise watch of the stub below does: times out at once (no GPS), or sends a position and
// then times out (GPS that pauses).
export const PRECISE_WATCH = {
  TIMES_OUT: 'times-out',
  PAUSES: 'pauses',
} as const;

type PreciseWatch = (typeof PRECISE_WATCH)[keyof typeof PRECISE_WATCH];

// A device without GPS: a precise position times out, a rough one is found, for a single request
// and for a watch. Takes effect from the next load.
export async function stubGeolocationWithoutGps(
  page: Page,
  point: GeoPoint,
  preciseWatch: PreciseWatch = PRECISE_WATCH.TIMES_OUT,
): Promise<void> {
  await page.addInitScript(
    ([found, modesKey, precise, pauses]) => {
      const watchModes: boolean[] = [];
      const clearedWatches = new Set<number>();
      Reflect.set(window, modesKey, watchModes);
      const TIMEOUT = 3;
      const position = { coords: { ...found, accuracy: 1000 }, timestamp: Date.now() };
      const timeout = {
        code: TIMEOUT,
        message: 'Timeout expired',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT,
      };
      type Success = (answer: typeof position) => void;
      type Failure = (answer: typeof timeout) => void;

      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: Success, error: Failure, options?: PositionOptions) =>
            options?.enableHighAccuracy === true ? error(timeout) : success(position),
          watchPosition: (success: Success, error: Failure, options?: PositionOptions) => {
            const isPrecise = options?.enableHighAccuracy === true;
            const watchId = watchModes.push(isPrecise);
            // Asynchronously, as a browser answers, and never for a cleared watch.
            setTimeout(() => {
              if (clearedWatches.has(watchId)) {
                return;
              }

              if (!isPrecise) {
                success(position);
              } else if (precise === pauses) {
                success(position);
                error(timeout);
              } else {
                error(timeout);
              }
            });

            return watchId;
          },
          clearWatch: (watchId: number) => clearedWatches.add(watchId),
        },
      });
    },
    [point, WATCH_MODES_KEY, preciseWatch, PRECISE_WATCH.PAUSES] as const,
  );
}

// The accuracy of every watch the stubbed page started: true for a precise one.
export function getWatchModes(page: Page): Promise<unknown> {
  return page.evaluate((modesKey) => Reflect.get(window, modesKey), WATCH_MODES_KEY);
}
