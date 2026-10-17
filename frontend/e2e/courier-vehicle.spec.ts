import { expect, test } from '@playwright/test';
import {
  COURIER_VEHICLE_TEXTS,
  VEHICLE_VALIDATION_MESSAGES,
} from '../src/pages/courier-vehicle/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  requireCourier,
  signInAsCourier,
  signInAsCourierByForm,
  stubCourierWithoutVehicle,
} from './support/courier';
import { fillCar, saveVehicleButton, waitForPath } from './support/courier-pages';

// These tests change nothing on the backend; the ones that do are in courier-shift.spec.ts.
const WRONG_PLATE = '12*4';

test.beforeEach(() => {
  requireCourier();
});

test('should open the vehicle page when a courier without a vehicle signs in', async ({ page }) => {
  await stubCourierWithoutVehicle(page);

  await signInAsCourierByForm(page);

  await waitForPath(page, APP_ROUTES.COURIER_VEHICLE);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    COURIER_VEHICLE_TEXTS.PAGE_TITLE,
  );
  await expect(page.getByText(COURIER_VEHICLE_TEXTS.NO_VEHICLE)).toBeVisible();
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
  await saveVehicleButton(page).click();

  const plate = page.getByLabel(COURIER_VEHICLE_TEXTS.LICENSE_PLATE, { exact: true });
  await expect(plate).toHaveAttribute('aria-invalid', 'true');
  await expect(plate).toHaveAccessibleDescription(VEHICLE_VALIDATION_MESSAGES.PLATE_INVALID);
  await expect(plate).toBeFocused();
  expect(isSent).toBe(false);
});
