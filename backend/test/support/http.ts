import { TEST_IP_PREFIX } from './constants';

let counter = 0;

// Each request gets its own address, so per-IP rate limits never interfere between tests.
export function nextClientIp(): string {
  counter += 1;

  return `${TEST_IP_PREFIX}${counter}`;
}

type ResponseWithStatus = { status: number };

export function sortedStatuses(responses: ResponseWithStatus[]): number[] {
  return responses.map((response) => response.status).sort((first, second) => first - second);
}
