import type { Request } from 'express';
import { readCookie } from './request-cookies';

const COOKIE_NAME = 'session';

function buildRequest(cookies: unknown): Request {
  return { cookies } as Request;
}

describe('readCookie', () => {
  it('should return the value of the cookie', () => {
    expect(readCookie(buildRequest({ [COOKIE_NAME]: 'abc' }), COOKIE_NAME)).toBe('abc');
  });

  it('should return undefined when the request has no such cookie', () => {
    expect(readCookie(buildRequest({ other: 'abc' }), COOKIE_NAME)).toBeUndefined();
  });

  it('should return undefined when cookies were not parsed', () => {
    expect(readCookie(buildRequest(undefined), COOKIE_NAME)).toBeUndefined();
  });

  it('should return undefined when the value is not a string', () => {
    const request = buildRequest({ [COOKIE_NAME]: { nested: 'abc' } });

    expect(readCookie(request, COOKIE_NAME)).toBeUndefined();
  });
});
