import type { NestExpressApplication } from '@nestjs/platform-express';
import { isNotNull } from 'drizzle-orm';
import request from 'supertest';
import { AUTH_ROUTES } from '../../src/auth/constants/routes.constants';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_REUSE_GRACE_MS,
} from '../../src/auth/constants/tokens.constants';
import type { AuthResponse, OAuthProfile } from '../../src/auth/auth.types';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '../../src/common/constants/csrf.constants';
import { GLOBAL_PREFIX } from '../../src/common/constants/http.constants';
import { MS_PER_SECOND } from '../../src/common/constants/time.constants';
import { OAUTH_PROVIDER } from '../../src/common/enums/oauth-provider.enum';
import type { Database } from '../../src/database/database.module';
import { refreshTokens } from '../../src/db/schema';
import { CLIENT_IP_HEADER } from './constants';
import { nextClientIp } from './http';

export const AUTH_URL = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
export const AUTHORIZATION_HEADER = 'Authorization';
export const COOKIE_HEADER = 'Cookie';
export const SET_COOKIE_HEADER = 'set-cookie';
export const WRONG_PASSWORD = 'Wrong1234!';

const COOKIE_ATTRIBUTES_SEPARATOR = ';';
const COOKIE_PAIR_SEPARATOR = '; ';
const COOKIE_NAME_VALUE_SEPARATOR = '=';

type ResponseWithHeaders = { headers: Record<string, unknown> };

export const validRegistration = {
  firstName: 'Иван',
  lastName: 'Петров',
  email: 'ivan@example.com',
  phone: '+375291234567',
  password: 'Test1234!',
};

// A POST without the CSRF header, for tests of the protection itself.
export function rawPostAuth(app: NestExpressApplication, route: string) {
  return request(app.getHttpServer())
    .post(`${AUTH_URL}/${route}`)
    .set(CLIENT_IP_HEADER, nextClientIp());
}

// A POST as the real client sends it, with the CSRF header.
export function postAuth(app: NestExpressApplication, route: string) {
  return rawPostAuth(app, route).set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
}

export function getAuth(app: NestExpressApplication, route: string) {
  return request(app.getHttpServer())
    .get(`${AUTH_URL}/${route}`)
    .set(CLIENT_IP_HEADER, nextClientIp());
}

// supertest types every header as a string, but Set-Cookie is really an array.
export function getSetCookies(response: ResponseWithHeaders): string[] {
  const setCookie = response.headers[SET_COOKIE_HEADER];

  return Array.isArray(setCookie)
    ? setCookie.filter((item): item is string => typeof item === 'string')
    : [];
}

export function findSetCookie(response: ResponseWithHeaders, name: string): string | undefined {
  return getSetCookies(response).find((item) =>
    item.startsWith(`${name}${COOKIE_NAME_VALUE_SEPARATOR}`),
  );
}

// An empty value means the server cleared the cookie.
export function extractCookieValue(response: ResponseWithHeaders, name: string): string {
  const cookie = findSetCookie(response, name);

  if (cookie === undefined) {
    throw new Error(`Cookie ${name} was not set`);
  }

  const pair = cookie.split(COOKIE_ATTRIBUTES_SEPARATOR)[0];

  return pair.slice(name.length + COOKIE_NAME_VALUE_SEPARATOR.length);
}

export function extractAccessToken(response: ResponseWithHeaders): string {
  return extractCookieValue(response, ACCESS_COOKIE_NAME);
}

export function extractRefreshToken(response: ResponseWithHeaders): string {
  return extractCookieValue(response, REFRESH_COOKIE_NAME);
}

export function refreshCookie(token: string): string {
  return `${REFRESH_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${token}`;
}

export function accessCookie(token: string): string {
  return `${ACCESS_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${token}`;
}

// What a browser would send back after a login: both session cookies in one header.
export function sessionCookieHeader(response: ResponseWithHeaders): string {
  return [
    accessCookie(extractAccessToken(response)),
    refreshCookie(extractRefreshToken(response)),
  ].join(COOKIE_PAIR_SEPARATOR);
}

export async function registerUser(
  app: NestExpressApplication,
  data: Record<string, string> = validRegistration,
) {
  const response = await postAuth(app, AUTH_ROUTES.REGISTER).send(data).expect(201);

  return {
    body: response.body as AuthResponse,
    accessToken: extractAccessToken(response),
    refreshToken: extractRefreshToken(response),
    cookies: sessionCookieHeader(response),
  };
}

// The default email matches the user created by registerUser, so tests can claim or link that account.
export function buildOAuthProfile(overrides: Partial<OAuthProfile> = {}): OAuthProfile {
  return {
    provider: OAUTH_PROVIDER.GOOGLE,
    providerUserId: 'google-user-1',
    email: validRegistration.email,
    emailVerified: true,
    firstName: validRegistration.firstName,
    lastName: validRegistration.lastName,
    ...overrides,
  };
}

// Moves every rotation of a refresh token out of the grace window, as if the time had passed.
export async function endRefreshGraceWindow(db: Database): Promise<void> {
  const rotatedAt = new Date(Date.now() - REFRESH_REUSE_GRACE_MS - MS_PER_SECOND);

  await db.update(refreshTokens).set({ rotatedAt }).where(isNotNull(refreshTokens.rotatedAt));
}
