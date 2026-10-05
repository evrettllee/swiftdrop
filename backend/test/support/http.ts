import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  GLOBAL_PREFIX,
} from '../../src/common/common.constants';
import { CLIENT_IP_HEADER, TEST_IP_PREFIX } from './constants';

let counter = 0;

// Each request gets its own address, so per-IP rate limits never interfere between tests.
export function nextClientIp(): string {
  counter += 1;

  return `${TEST_IP_PREFIX}${counter}`;
}

// A POST as the real client sends it: under the API prefix, with the CSRF header and its own address.
export function postApi(app: NestExpressApplication, path: string) {
  return request(app.getHttpServer())
    .post(`/${GLOBAL_PREFIX}/${path}`)
    .set(CLIENT_IP_HEADER, nextClientIp())
    .set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
}

type ResponseWithStatus = { status: number };

export function sortedStatuses(responses: ResponseWithStatus[]): number[] {
  return responses.map((response) => response.status).sort((first, second) => first - second);
}
