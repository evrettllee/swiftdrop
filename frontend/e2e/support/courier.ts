import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { AUTH_TEXTS } from '../../src/pages/auth/config/texts';
import { COURIERS_API_PATHS, type CourierMe } from '../../src/shared/api/endpoints/courier';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/shared/api/request-config';
import type { GeoPoint } from '../../src/shared/lib/geo/geo-point';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';

// Couriers are not registered through the API: the account comes from the seed of the backend,
// and its email and password are given to the tests through these variables.
const COURIER_EMAIL = process.env.E2E_COURIER_EMAIL ?? '';
const COURIER_PASSWORD = process.env.E2E_COURIER_PASSWORD ?? '';

const COURIER_ME_URL = `${API_BASE_PATH}${COURIERS_API_PATHS.ME}`;
const COURIER_VEHICLE_URL = `${API_BASE_PATH}${COURIERS_API_PATHS.VEHICLE}`;
const COURIER_AVAILABILITY_URL = `${API_BASE_PATH}${COURIERS_API_PATHS.AVAILABILITY}`;

// Skips the test when the seeded courier is not given.
export function requireCourier(): void {
  test.skip(
    COURIER_EMAIL === '' || COURIER_PASSWORD === '',
    'Set E2E_COURIER_EMAIL and E2E_COURIER_PASSWORD to the seeded courier',
  );
}

// Signs the courier in through the form of the auth page, as a person would.
export async function signInAsCourier(page: Page): Promise<void> {
  await page.goto(APP_ROUTES.AUTH);
  await page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true }).fill(COURIER_EMAIL);
  await page.getByLabel(AUTH_TEXTS.LABEL_PASSWORD, { exact: true }).fill(COURIER_PASSWORD);
  await page.getByRole('button', { name: AUTH_TEXTS.SUBMIT_LOGIN, exact: true }).click();
}

// The profile of the signed-in courier (the request shares the cookies of the page).
export async function getCourierMe(request: APIRequestContext): Promise<CourierMe> {
  const response = await request.get(COURIER_ME_URL);

  expect(response.ok(), await response.text()).toBe(true);

  return (await response.json()) as CourierMe;
}

// Puts the vehicle back as it was: the seeded courier is shared by the tests and by people.
export async function restoreVehicle(
  request: APIRequestContext,
  vehicle: CourierMe['vehicle'],
): Promise<void> {
  if (vehicle !== null) {
    const body = Object.fromEntries(Object.entries(vehicle).filter(([, value]) => value !== null));
    const response = await request.put(COURIER_VEHICLE_URL, {
      headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      data: body,
    });

    expect(response.ok(), await response.text()).toBe(true);
  }
}

// Answers the profile of the cabinet as if the courier had no vehicle yet.
export async function stubCourierWithoutVehicle(page: Page): Promise<void> {
  const profile: CourierMe = { isAvailable: false, vehicle: null, activeOrderId: null };

  await page.route(`**${COURIER_ME_URL}`, (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: profile }) : route.fallback(),
  );
}

// Puts the courier on or off the line through the API, for example back off it after a test.
export async function setCourierAvailability(
  request: APIRequestContext,
  isAvailable: boolean,
): Promise<void> {
  const response = await request.put(COURIER_AVAILABILITY_URL, {
    headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
    data: { isAvailable },
  });

  expect(response.ok(), await response.text()).toBe(true);
}

// Denies the position to the page, as a courier who refused it in the browser: the geolocation of
// the page answers every request with PERMISSION_DENIED. Takes effect from the next load.
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
  });
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
