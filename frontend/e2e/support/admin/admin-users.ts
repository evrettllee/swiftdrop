import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
} from '@playwright/test';
import { AUTH_API_PATHS } from '../../../src/shared/api/endpoints/auth';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../../src/shared/api/request-config';
import { paceAdminWrite, paceStandLogin } from './admin-pace';
import { STAND, STAND_FRONTEND_URL } from '../stand';

const CSRF_HEADERS = { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE };
const USERS_PATH = `${API_BASE_PATH}/admin/users`;
const NAME_LETTERS = 'абвгдежзиклмнопрстуфхцчшэюя';
const TOKEN_LENGTH = 6;
const PHONE_SUFFIX_RANGE = 10_000_000;
const LIST_MAX = 100;

export const PHONE_VIEWPORT = { width: 375, height: 812 };

export type AdminSession = { context: BrowserContext; page: Page; api: APIRequestContext };

export type StaffSeed = {
  role: 'courier' | 'manager';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ListedUser = { userId: number; email: string; status: string };

export async function openAdminSession(
  browser: Browser,
  viewport?: { width: number; height: number },
): Promise<AdminSession> {
  const context = await browser.newContext({
    baseURL: STAND_FRONTEND_URL,
    permissions: ['clipboard-read', 'clipboard-write'],
    ...(viewport === undefined ? {} : { viewport }),
  });
  await paceStandLogin();
  const response = await context.request.post(`${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, {
    headers: CSRF_HEADERS,
    data: { email: STAND.ADMIN_EMAIL, password: STAND.ADMIN_PASSWORD },
  });
  expect(response.ok(), await response.text()).toBe(true);

  return { context, page: await context.newPage(), api: context.request };
}

export function nameToken(): string {
  const letters = Array.from(
    { length: TOKEN_LENGTH },
    () => NAME_LETTERS[Math.floor(Math.random() * NAME_LETTERS.length)],
  ).join('');

  return letters.charAt(0).toUpperCase() + letters.slice(1);
}

export function uniquePhone(): string {
  return `+37533${String(Math.floor(Math.random() * PHONE_SUFFIX_RANGE)).padStart(7, '0')}`;
}

export function staffSeed(role: StaffSeed['role'], lastName: string, email: string): StaffSeed {
  return { role, firstName: 'Тест', lastName, email, phone: uniquePhone() };
}

export async function inviteVia(api: APIRequestContext, seed: StaffSeed): Promise<number> {
  await paceAdminWrite();
  const response = await api.post(`${API_BASE_PATH}/admin/staff`, {
    headers: CSRF_HEADERS,
    data: seed,
  });
  expect(response.ok(), await response.text()).toBe(true);

  return ((await response.json()) as { userId: number }).userId;
}

export async function deleteVia(api: APIRequestContext, userId: number): Promise<void> {
  const response = await api.delete(`${USERS_PATH}/${userId}`, { headers: CSRF_HEADERS });
  expect(response.ok(), await response.text()).toBe(true);
}

export async function listVia(
  api: APIRequestContext,
  query: Record<string, string>,
): Promise<{ items: ListedUser[]; total: number }> {
  const search = new URLSearchParams({ limit: String(LIST_MAX), ...query });
  const response = await api.get(`${USERS_PATH}?${search.toString()}`);
  expect(response.ok(), await response.text()).toBe(true);

  return (await response.json()) as { items: ListedUser[]; total: number };
}

export async function countsVia(
  api: APIRequestContext,
): Promise<{ client: number; courier: number; manager: number }> {
  const response = await api.get(`${USERS_PATH}/counts`);
  expect(response.ok()).toBe(true);

  return (await response.json()) as { client: number; courier: number; manager: number };
}

export function usersRows(page: Page) {
  return page.getByRole('table', { name: 'Пользователи' }).locator('tbody tr');
}
