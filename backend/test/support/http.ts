import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '../../src/common/constants/csrf.constants';
import { GLOBAL_PREFIX } from '../../src/common/constants/http.constants';
import { CLIENT_IP_HEADER, TEST_IP_PREFIX } from './constants';

let counter = 0;

// Each request gets its own address, so per-IP rate limits never interfere between tests.
export function nextClientIp(): string {
  counter += 1;

  return `${TEST_IP_PREFIX}${counter}`;
}

// A POST under the API prefix with its own address and without the CSRF header: the way another
// server calls the API, and the way to test the protection itself.
export function rawPostApi(app: NestExpressApplication, path: string) {
  return request(app.getHttpServer())
    .post(`/${GLOBAL_PREFIX}/${path}`)
    .set(CLIENT_IP_HEADER, nextClientIp());
}

// A POST as the real client sends it, with the CSRF header.
export function postApi(app: NestExpressApplication, path: string) {
  return rawPostApi(app, path).set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
}

// A GET under the API prefix with its own address, the CSRF header is not needed for reads.
export function getApi(app: NestExpressApplication, path: string) {
  return request(app.getHttpServer())
    .get(`/${GLOBAL_PREFIX}/${path}`)
    .set(CLIENT_IP_HEADER, nextClientIp());
}

type ResponseWithStatus = { status: number };

export function sortedStatuses(responses: ResponseWithStatus[]): number[] {
  return responses.map((response) => response.status).sort((first, second) => first - second);
}
