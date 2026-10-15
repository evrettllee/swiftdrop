import { type BrowserContext, expect, test } from '@playwright/test';
import { GEO_ALERT_TEXTS, LINE_TEXTS } from '../src/pages/courier-work/config/texts';
import { VEHICLE_TYPE } from '../src/shared/api/endpoints/courier';
import { CITY_CENTER } from '../src/shared/config/map';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  denyGeolocation,
  getCourierMe,
  getWatchModes,
  PRECISE_WATCH,
  requireCourier,
  restoreVehicle,
  setCourierAvailability,
  signInAsCourier,
  stubGeolocationWithoutGps,
} from './support/courier';
import { fillCar, saveVehicleButton, TEST_CAR, waitForPath } from './support/courier-pages';

// These tests change the seeded courier (the line, the vehicle), so they run one after another
// and put the courier back off the line at the end.
test.describe.configure({ mode: 'serial' });

const [MINSK_LATITUDE, MINSK_LONGITUDE] = CITY_CENTER;
const SAVED_PLATE = '1234 AB-7';

test.use({
  geolocation: { latitude: MINSK_LATITUDE, longitude: MINSK_LONGITUDE },
  permissions: ['geolocation'],
});

type Cookies = Awaited<ReturnType<BrowserContext['cookies']>>;

let courierCookies: Cookies = [];

// The sign-in of the backend is rate-limited, so the courier signs in once for the whole file and
// every test starts with the cookies of that session.
test.beforeAll(async ({ browser }) => {
  requireCourier();
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
  courierCookies = await context.cookies();
  await context.close();
});

test.beforeEach(async ({ page }) => {
  await page.context().addCookies(courierCookies);
  await page.goto(APP_ROUTES.COURIER_WORK);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
  // A test before may have failed on the line.
  await setCourierAvailability(page.request, false);
  await page.reload();
});

test.afterEach(async ({ page }) => {
  await setCourierAvailability(page.request, false);
});

test('should go on the line and back off it when the courier presses the buttons', async ({
  page,
}) => {
  await page.getByRole('button', { name: LINE_TEXTS.GO_ONLINE }).click();

  await expect(page.getByRole('heading', { name: LINE_TEXTS.ONLINE_TITLE })).toBeVisible();
  expect((await getCourierMe(page.request)).isAvailable).toBe(true);

  await page.getByRole('button', { name: LINE_TEXTS.GO_OFFLINE }).click();

  await expect(page.getByRole('heading', { name: LINE_TEXTS.OFFLINE_TITLE })).toBeVisible();
  expect((await getCourierMe(page.request)).isAvailable).toBe(false);
});

test('should stay off the line and explain why when the position is denied', async ({ page }) => {
  await denyGeolocation(page);
  await page.reload();

  await page.getByRole('button', { name: LINE_TEXTS.GO_ONLINE }).click();

  await expect(page.getByRole('alert')).toContainText(GEO_ALERT_TEXTS.DENIED_TITLE);
  await expect(page.getByRole('heading', { name: LINE_TEXTS.OFFLINE_TITLE })).toBeVisible();
  expect((await getCourierMe(page.request)).isAvailable).toBe(false);
});

test('should go on the line and keep watching roughly when the precise position times out', async ({
  page,
}) => {
  await stubGeolocationWithoutGps(page, { latitude: MINSK_LATITUDE, longitude: MINSK_LONGITUDE });
  await page.reload();

  await page.getByRole('button', { name: LINE_TEXTS.GO_ONLINE }).click();

  await expect(page.getByRole('heading', { name: LINE_TEXTS.ONLINE_TITLE })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect((await getCourierMe(page.request)).isAvailable).toBe(true);
  // The precise watch timed out and the rough one took its place.
  await expect.poll(() => getWatchModes(page)).toEqual([true, false]);
});

test('should keep watching precisely when the GPS pauses after its first position', async ({
  page,
}) => {
  await stubGeolocationWithoutGps(
    page,
    { latitude: MINSK_LATITUDE, longitude: MINSK_LONGITUDE },
    PRECISE_WATCH.PAUSES,
  );
  await page.reload();

  await page.getByRole('button', { name: LINE_TEXTS.GO_ONLINE }).click();

  await expect(page.getByRole('heading', { name: LINE_TEXTS.ONLINE_TITLE })).toBeVisible();
  // The precise watch sent a position, so its timeout is a pause: no rough watch is started.
  await expect.poll(() => getWatchModes(page)).toEqual([true]);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect((await getCourierMe(page.request)).isAvailable).toBe(true);
});

test('should open the vehicle page when the courier changes the vehicle', async ({ page }) => {
  await page.getByRole('link', { name: LINE_TEXTS.CHANGE_VEHICLE }).click();

  await waitForPath(page, APP_ROUTES.COURIER_VEHICLE);
});

test('should save the plate in upper case and return to the work page when a courier saves a car', async ({
  page,
}) => {
  const before = await getCourierMe(page.request);

  try {
    await page.goto(APP_ROUTES.COURIER_VEHICLE);
    await fillCar(page, TEST_CAR.plate);
    await saveVehicleButton(page).click();

    await waitForPath(page, APP_ROUTES.COURIER_WORK);
    expect((await getCourierMe(page.request)).vehicle).toEqual({
      type: VEHICLE_TYPE.CAR,
      brand: TEST_CAR.brand,
      model: TEST_CAR.model,
      licensePlate: SAVED_PLATE,
    });
  } finally {
    await restoreVehicle(page.request, before.vehicle);
  }
});
