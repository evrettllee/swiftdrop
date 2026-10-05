import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AUTH_ROUTES } from '../src/auth/auth-routes.constants';
import { REFRESH_COOKIE_NAME } from '../src/auth/auth-token.constants';
import type { AuthResponse } from '../src/auth/auth.types';
import { GLOBAL_PREFIX } from '../src/common/constants/app.constants';
import { nextClientIp } from './client-ip';
import { CLIENT_IP_HEADER } from './test.constants';

export const AUTH_URL = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
export const AUTHORIZATION_HEADER = 'Authorization';
export const COOKIE_HEADER = 'Cookie';
export const SET_COOKIE_HEADER = 'set-cookie';
export const WRONG_PASSWORD = 'Wrong1234!';

const COOKIE_ATTRIBUTES_SEPARATOR = ';';
const COOKIE_VALUE_OFFSET = REFRESH_COOKIE_NAME.length + 1;

type ResponseWithHeaders = { headers: Record<string, unknown> };

export const validRegistration = {
  firstName: 'Иван',
  lastName: 'Петров',
  email: 'ivan@example.com',
  phone: '+375291234567',
  password: 'Test1234!',
};

export function postAuth(app: NestExpressApplication, route: string) {
  return request(app.getHttpServer())
    .post(`${AUTH_URL}/${route}`)
    .set(CLIENT_IP_HEADER, nextClientIp());
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

export function extractRefreshToken(response: ResponseWithHeaders): string {
  const cookie = getSetCookies(response).find((item) => item.startsWith(`${REFRESH_COOKIE_NAME}=`));

  if (!cookie) {
    throw new Error('Refresh cookie was not set');
  }

  return cookie.split(COOKIE_ATTRIBUTES_SEPARATOR)[0].slice(COOKIE_VALUE_OFFSET);
}

export function refreshCookie(token: string): string {
  return `${REFRESH_COOKIE_NAME}=${token}`;
}

export async function registerUser(
  app: NestExpressApplication,
  data: Record<string, string> = validRegistration,
) {
  const response = await postAuth(app, AUTH_ROUTES.REGISTER).send(data).expect(201);

  return {
    body: response.body as AuthResponse,
    refreshToken: extractRefreshToken(response),
  };
}
