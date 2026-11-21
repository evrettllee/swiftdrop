import { type APIRequestContext, expect, type Locator, type Page } from '@playwright/test';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/shared/api/request-config';
import { paceAdminWrite } from './admin-pace';
import { nameToken } from './admin-users';

export const SEEDED_TARIFF = 'Стандартный';
export const SEEDED_ZONE = 'Минск';
export const TARIFFS_PATH = '/admin/tariffs';
export const TARIFFS_API = `${API_BASE_PATH}/admin/tariffs`;

export type TariffSeed = {
  name: string;
  pricePerKm: number;
  pricePerKg: number;
  minPrice: number;
  fragileFee: number;
};

export function tariffName(): string {
  return `Тест ${nameToken()}`;
}

export function tariffSeed(name = tariffName()): TariffSeed {
  return { name, pricePerKm: 0.85, pricePerKg: 0.3, minPrice: 5, fragileFee: 2 };
}

export async function createTariffVia(
  api: APIRequestContext,
  seed: TariffSeed,
): Promise<number> {
  await paceAdminWrite();
  const response = await api.post(TARIFFS_API, {
    headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
    data: seed,
  });
  expect(response.ok(), await response.text()).toBe(true);

  return ((await response.json()) as { tariffId: number }).tariffId;
}

export function tariffsTable(page: Page): Locator {
  return page.getByRole('table', { name: 'Тарифы' });
}

export function tariffRow(page: Page, name: string): Locator {
  return tariffsTable(page)
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: `Изменить тариф ${name}`, exact: true }) });
}

export function editRow(page: Page): Locator {
  return tariffsTable(page)
    .getByRole('row')
    .filter({ has: page.getByRole('textbox', { name: 'Название тарифа' }) });
}

export async function openTariffs(page: Page): Promise<void> {
  await page.goto(TARIFFS_PATH);
  await expect(page.getByRole('heading', { level: 1, name: 'Тарифы' })).toBeVisible();
  await expect(tariffRow(page, SEEDED_TARIFF)).toBeVisible();
}
