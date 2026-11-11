import { expect, type Page, test } from '@playwright/test';
import { lastMapRequest, MAP_PATH, stubCouriersMap } from './support/manager-map';

function vehicles(page: Page) {
  return page.getByRole('group', { name: 'Транспорт' }).getByRole('button');
}

function vehicle(page: Page, name: string) {
  return vehicles(page).filter({ hasText: name });
}

test('should choose several transports into the address and keep them after a reload', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  await page.goto(MAP_PATH);

  await expect(vehicles(page)).toHaveText([
    'Пеший',
    'Велосипед',
    'Самокат',
    'Легковой',
    'Грузовой',
  ]);
  await expect(vehicles(page).and(page.locator('[aria-pressed="true"]'))).toHaveCount(0);
  expect(lastMapRequest(stub).get('vehicleType')).toBeNull();

  await vehicle(page, 'Легковой').click();
  await vehicle(page, 'Пеший').click();

  await expect(page).toHaveURL(/vehicleType=foot(%2C|,)car$/);
  await expect.poll(() => lastMapRequest(stub).get('vehicleType')).toBe('foot,car');
  await expect(vehicle(page, 'Пеший')).toHaveAttribute('aria-pressed', 'true');
  await expect(vehicle(page, 'Легковой')).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(vehicle(page, 'Пеший')).toHaveAttribute('aria-pressed', 'true');
  await expect(vehicle(page, 'Легковой')).toHaveAttribute('aria-pressed', 'true');
  await expect(vehicle(page, 'Самокат')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => lastMapRequest(stub).get('vehicleType')).toBe('foot,car');
});

test('should show every transport again once the last chosen chip is pressed off', async ({
  page,
}) => {
  const stub = await stubCouriersMap(page);
  await page.goto(`${MAP_PATH}?vehicleType=truck`);
  await expect(vehicle(page, 'Грузовой')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => lastMapRequest(stub).get('vehicleType')).toBe('truck');

  await vehicle(page, 'Грузовой').click();

  await expect(page).toHaveURL(MAP_PATH);
  await expect(vehicle(page, 'Грузовой')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => lastMapRequest(stub).get('vehicleType')).toBeNull();
});
