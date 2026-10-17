import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { AUTH_TEXTS } from '../../src/pages/auth/config/texts';
import { COURIERS_API_PATHS, type CourierMe } from '../../src/shared/api/endpoints/courier';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/shared/api/request-config';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';
import { readSavedCourierCookies } from './courier-session';

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

// Signs the courier in through the form of the auth page, as a person would. The specs that are
// about the sign-in itself use it; the others use signInAsCourier.
export async function signInAsCourierByForm(page: Page): Promise<void> {
  await page.goto(APP_ROUTES.AUTH);
  await page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true }).fill(COURIER_EMAIL);
  await page.getByLabel(AUTH_TEXTS.LABEL_PASSWORD, { exact: true }).fill(COURIER_PASSWORD);
  await page.getByRole('button', { name: AUTH_TEXTS.SUBMIT_LOGIN, exact: true }).click();
}

// Opens the cabinet signed in as the courier, with the session the global setup saved (the sign-in
// of the backend is rate-limited); without a saved session it signs in through the form.
export async function signInAsCourier(page: Page): Promise<void> {
  const cookies = readSavedCourierCookies();

  if (cookies === null) {
    await signInAsCourierByForm(page);

    return;
  }

  await page.context().addCookies(cookies);
  await page.goto(APP_ROUTES.COURIER_WORK);
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

// Answers the profile of the cabinet as if the courier were on the line, without putting the seeded
// courier on it: the page follows the device, and the backend refuses its positions (off_shift).
export async function stubCourierOnLine(page: Page): Promise<void> {
  const profile: CourierMe = { ...(await getCourierMe(page.request)), isAvailable: true };

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
