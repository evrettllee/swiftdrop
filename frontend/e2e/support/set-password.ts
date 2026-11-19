import { type APIRequestContext, expect, type Page, request } from '@playwright/test';
import { AUTH_TEXTS } from '../../src/pages/auth/config/texts';
import { AUTH_API_PATHS } from '../../src/shared/api/endpoints/auth';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/shared/api/request-config';
import { STAND, STAND_FRONTEND_URL } from './stand';

const LINK_WINDOW_MS = 61_000;
const LINK_GETS_ALLOWED = 8;
const GETS_PER_OPEN = 2;
const opened: number[] = [];

export const STAND_PASSWORD = 'Strong-Pass-2026!';
export const WEAK_PASSWORD = 'abc';

const CSRF_HEADERS = { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE };
const STAFF_PATH = `${API_BASE_PATH}/admin/staff`;
const PHONE_SUFFIX_RANGE = 10_000_000;

export type StaffRole = 'courier' | 'manager';

export type IssuedLink = {
  userId: number;
  email: string;
  token: string;
};

type LinkResponse = { userId: number; email: string; setPasswordUrl: string };

function tokenFrom(setPasswordUrl: string): string {
  const token = new URL(setPasswordUrl).pathname.split('/').pop();

  if (token === undefined || token === '') {
    throw new Error('The invitation has no token');
  }

  return token;
}

async function readLink(
  response: Awaited<ReturnType<APIRequestContext['post']>>,
): Promise<IssuedLink> {
  expect(response.ok(), await response.text()).toBe(true);
  const body = (await response.json()) as LinkResponse;

  return { userId: body.userId, email: body.email, token: tokenFrom(body.setPasswordUrl) };
}

export async function signInStandAdmin(): Promise<APIRequestContext> {
  const admin = await request.newContext({ baseURL: STAND_FRONTEND_URL });
  const response = await admin.post(`${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, {
    headers: CSRF_HEADERS,
    data: { email: STAND.ADMIN_EMAIL, password: STAND.ADMIN_PASSWORD },
  });
  expect(response.ok()).toBe(true);

  return admin;
}

function uniquePhone(): string {
  const suffix = Math.floor(Math.random() * PHONE_SUFFIX_RANGE);

  return `+37529${String(suffix).padStart(7, '0')}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@swiftdrop.test`;
}

export async function inviteStaff(
  admin: APIRequestContext,
  role: StaffRole,
  firstName = 'Иван',
): Promise<IssuedLink> {
  const response = await admin.post(STAFF_PATH, {
    headers: CSRF_HEADERS,
    data: {
      role,
      firstName,
      lastName: 'Петров',
      email: uniqueEmail(role),
      phone: uniquePhone(),
    },
  });

  return readLink(response);
}

export async function resetPassword(admin: APIRequestContext, userId: number): Promise<IssuedLink> {
  const response = await admin.post(`${API_BASE_PATH}/admin/users/${userId}/password-reset`, {
    headers: CSRF_HEADERS,
  });

  return readLink(response);
}

export async function setPasswordThroughApi(token: string, password: string): Promise<void> {
  const anonymous = await request.newContext({ baseURL: STAND_FRONTEND_URL });
  const response = await anonymous.post(
    `${API_BASE_PATH}${AUTH_API_PATHS.PASSWORD_LINKS}/${token}`,
    {
      headers: CSRF_HEADERS,
      data: { password },
    },
  );
  expect(response.ok()).toBe(true);
  await anonymous.dispose();
}

export async function loginStatus(email: string, password: string): Promise<number> {
  const anonymous = await request.newContext({ baseURL: STAND_FRONTEND_URL });
  const response = await anonymous.post(`${API_BASE_PATH}${AUTH_API_PATHS.LOGIN}`, {
    headers: CSRF_HEADERS,
    data: { email, password },
  });
  const status = response.status();
  await anonymous.dispose();

  return status;
}

export async function fillPasswords(
  page: Page,
  password: string,
  repeat = password,
): Promise<void> {
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByLabel(AUTH_TEXTS.LABEL_CONFIRM_PASSWORD, { exact: true }).fill(repeat);
}

export async function openSetPassword(page: Page, token: string): Promise<void> {
  const now = Date.now();

  while (opened.length > 0 && now - opened[0] >= LINK_WINDOW_MS) {
    opened.shift();
  }

  if ((opened.length + 1) * GETS_PER_OPEN > LINK_GETS_ALLOWED) {
    await page.waitForTimeout(opened[0] + LINK_WINDOW_MS - now);
  }

  opened.push(Date.now());
  await page.goto(`/set-password/${token}`);
}

export async function expectNoOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}
