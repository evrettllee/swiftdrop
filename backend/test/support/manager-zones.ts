import type { NestExpressApplication } from '@nestjs/platform-express';
import { MANAGER_ZONES_ROUTES } from '@/modules/manager/constants/manager-zones.constants';
import { COOKIE_HEADER } from './auth';
import { getApi, patchApi, postApi } from './http';

const ZONES_PATH = `${MANAGER_ZONES_ROUTES.BASE}/${MANAGER_ZONES_ROUTES.ZONES}`;

export const WEST_POLYGON = [
  [
    [27.1, 53.85],
    [27.3, 53.85],
    [27.3, 53.95],
    [27.1, 53.95],
  ],
];
export const WEST_POINT = { latitude: 53.9, longitude: 27.2 };

function withCookies<T extends { set: (header: string, value: string) => T }>(
  request: T,
  cookies: string | null,
): T {
  return cookies === null ? request : request.set(COOKIE_HEADER, cookies);
}

export function getZones(app: NestExpressApplication, cookies: string | null) {
  return withCookies(getApi(app, ZONES_PATH), cookies);
}

export function getZone(app: NestExpressApplication, cookies: string | null, zoneId: number) {
  return withCookies(getApi(app, `${ZONES_PATH}/${zoneId}`), cookies);
}

export function getTariffs(app: NestExpressApplication, cookies: string | null) {
  return withCookies(
    getApi(app, `${MANAGER_ZONES_ROUTES.BASE}/${MANAGER_ZONES_ROUTES.TARIFFS}`),
    cookies,
  );
}

export function postZone(app: NestExpressApplication, cookies: string | null, body: object) {
  return withCookies(postApi(app, ZONES_PATH), cookies).send(body);
}

export function patchZone(
  app: NestExpressApplication,
  cookies: string | null,
  zoneId: number,
  body: object,
) {
  return withCookies(patchApi(app, `${ZONES_PATH}/${zoneId}`), cookies).send(body);
}
