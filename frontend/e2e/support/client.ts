import { randomInt, randomUUID } from 'node:crypto';
import { type APIRequestContext, expect } from '@playwright/test';
import { AUTH_API_PATHS } from '../../src/shared/api/endpoints/auth';
import {
  API_BASE_PATH,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '../../src/shared/api/request-config';

export type TestClient = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

// Meets the password rules: 8–72 characters with an upper and a lower case letter, a digit and
// a special character.
const PASSWORD = 'Swift-Drop-2026';
const EMAIL_DOMAIN = 'example.com';
// A Belarusian mobile number: the code and seven random digits.
const PHONE_PREFIX = '+37529';
const PHONE_LOCAL_DIGITS = 7;
const PHONE_LOCAL_LIMIT = 10 ** PHONE_LOCAL_DIGITS;

function uniquePhone(): string {
  return `${PHONE_PREFIX}${String(randomInt(PHONE_LOCAL_LIMIT)).padStart(PHONE_LOCAL_DIGITS, '0')}`;
}

// Registers a new client through the API, with an email and a phone of its own.
// With `page.request` the browser of the test is signed in as this client (they share the
// cookies); with the `request` fixture the browser stays a guest.
export async function registerClient(request: APIRequestContext): Promise<TestClient> {
  const client: TestClient = {
    firstName: 'Анна',
    lastName: 'Тестова',
    email: `e2e-${randomUUID()}@${EMAIL_DOMAIN}`,
    phone: uniquePhone(),
    password: PASSWORD,
  };

  const response = await request.post(`${API_BASE_PATH}${AUTH_API_PATHS.REGISTER}`, {
    headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
    data: client,
  });

  expect(response.ok(), await response.text()).toBe(true);

  return client;
}
