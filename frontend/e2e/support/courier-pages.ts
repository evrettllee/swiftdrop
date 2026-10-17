import type { Page } from '@playwright/test';
import { VEHICLE_TYPE_META } from '../../src/entities/courier/config/vehicle-types';
import { COURIER_VEHICLE_TEXTS } from '../../src/pages/courier-vehicle/config/texts';
import { VEHICLE_TYPE } from '../../src/shared/api/endpoints/courier';

export const TEST_CAR = { brand: 'Skoda', model: 'Octavia', plate: '1234 ab-7' } as const;

const CAR_LABEL = VEHICLE_TYPE_META[VEHICLE_TYPE.CAR].label;

export function waitForPath(page: Page, pathname: string): Promise<void> {
  return page.waitForURL((url) => url.pathname === pathname);
}

// Fills the vehicle form with the test car and the given plate.
export async function fillCar(page: Page, plate: string): Promise<void> {
  // The native radio is hidden under its card, so the card is clicked through its label.
  await page.getByText(CAR_LABEL, { exact: true }).click();
  await page.getByLabel(COURIER_VEHICLE_TEXTS.BRAND, { exact: true }).fill(TEST_CAR.brand);
  await page.getByLabel(COURIER_VEHICLE_TEXTS.MODEL, { exact: true }).fill(TEST_CAR.model);
  await page.getByLabel(COURIER_VEHICLE_TEXTS.LICENSE_PLATE, { exact: true }).fill(plate);
}

export function saveVehicleButton(page: Page) {
  return page.getByRole('button', { name: COURIER_VEHICLE_TEXTS.SUBMIT });
}
