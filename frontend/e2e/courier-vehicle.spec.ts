import { expect, type Page, test } from '@playwright/test';
import {
  COURIER_VEHICLE_TEXTS,
  VEHICLE_VALIDATION_MESSAGES,
} from '../src/pages/courier-vehicle/config/texts';
import { VEHICLE_TYPE_OPTIONS } from '../src/pages/courier-vehicle/config/vehicle-types';
import { VEHICLE_TYPE } from '../src/shared/api/endpoints/courier';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  getCourierMe,
  requireCourier,
  restoreVehicle,
  signInAsCourier,
  stubCourierWithoutVehicle,
} from './support/courier';

function findCarLabel(): string {
  const label = VEHICLE_TYPE_OPTIONS.find((option) => option.type === VEHICLE_TYPE.CAR)?.label;

  if (label === undefined) {
    throw new Error('The vehicle form has no card for a car');
  }

  return label;
}

const CAR_LABEL = findCarLabel();

const TEST_CAR = { brand: 'Skoda', model: 'Octavia', plate: '1234 ab-7' } as const;
const SAVED_PLATE = '1234 AB-7';
const WRONG_PLATE = '12*4';

function waitForPath(page: Page, pathname: string): Promise<void> {
  return page.waitForURL((url) => url.pathname === pathname);
}

async function fillCar(page: Page, plate: string): Promise<void> {
  // The native radio is hidden under its card, so the card is clicked through its label.
  await page.getByText(CAR_LABEL, { exact: true }).click();
  await page.getByLabel(COURIER_VEHICLE_TEXTS.BRAND, { exact: true }).fill(TEST_CAR.brand);
  await page.getByLabel(COURIER_VEHICLE_TEXTS.MODEL, { exact: true }).fill(TEST_CAR.model);
  await page.getByLabel(COURIER_VEHICLE_TEXTS.LICENSE_PLATE, { exact: true }).fill(plate);
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: COURIER_VEHICLE_TEXTS.SUBMIT });
}

test.beforeEach(() => {
  requireCourier();
});

test('should open the vehicle page when a courier without a vehicle signs in', async ({ page }) => {
  await stubCourierWithoutVehicle(page);

  await signInAsCourier(page);

  await waitForPath(page, APP_ROUTES.COURIER_VEHICLE);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    COURIER_VEHICLE_TEXTS.PAGE_TITLE,
  );
  await expect(page.getByText(COURIER_VEHICLE_TEXTS.NO_VEHICLE)).toBeVisible();
});

test('should save the plate in upper case and return to the work page when a courier saves a car', async ({
  page,
}) => {
  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
  const before = await getCourierMe(page.request);
  test.skip(before.isAvailable, 'The seeded courier is on the line: the vehicle cannot change');

  try {
    await page.goto(APP_ROUTES.COURIER_VEHICLE);
    await fillCar(page, TEST_CAR.plate);
    await saveButton(page).click();

    await waitForPath(page, APP_ROUTES.COURIER_WORK);
    const after = await getCourierMe(page.request);
    expect(after.vehicle).toEqual({
      type: VEHICLE_TYPE.CAR,
      brand: TEST_CAR.brand,
      model: TEST_CAR.model,
      licensePlate: SAVED_PLATE,
    });
  } finally {
    await restoreVehicle(page.request, before.vehicle);
  }
});

test('should show the error under the plate and send nothing when the plate is wrong', async ({
  page,
}) => {
  let isSent = false;
  page.on('request', (request) => {
    if (request.method() === 'PUT') {
      isSent = true;
    }
  });

  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
  await page.goto(APP_ROUTES.COURIER_VEHICLE);
  await fillCar(page, WRONG_PLATE);
  await saveButton(page).click();

  const plate = page.getByLabel(COURIER_VEHICLE_TEXTS.LICENSE_PLATE, { exact: true });
  await expect(plate).toHaveAttribute('aria-invalid', 'true');
  await expect(plate).toHaveAccessibleDescription(VEHICLE_VALIDATION_MESSAGES.PLATE_INVALID);
  await expect(plate).toBeFocused();
  expect(isSent).toBe(false);
});
