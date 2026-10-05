import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import {
  CSRF_ERROR_MESSAGE,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  SAFE_HTTP_METHODS,
} from '../common.constants';
import { CsrfGuard } from './csrf.guard';

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const HTTP_CONTEXT_TYPE = 'http';
const WS_CONTEXT_TYPE = 'ws';
const WRONG_HEADER_VALUE = 'something-else';

function createContext(
  method: string,
  headerValue?: string,
  contextType: string = HTTP_CONTEXT_TYPE,
): ExecutionContext {
  const request = {
    method,
    header: (name: string) => (name.toLowerCase() === CSRF_HEADER_NAME ? headerValue : undefined),
  };

  return {
    getType: () => contextType,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it.each(SAFE_HTTP_METHODS)('should allow a %s request when the header is missing', (method) => {
    expect(guard.canActivate(createContext(method))).toBe(true);
  });

  it.each(UNSAFE_METHODS)('should allow a %s request when the header is correct', (method) => {
    expect(guard.canActivate(createContext(method, CSRF_HEADER_VALUE))).toBe(true);
  });

  it.each(UNSAFE_METHODS)('should reject a %s request when the header is missing', (method) => {
    expect(() => guard.canActivate(createContext(method))).toThrow(
      new ForbiddenException(CSRF_ERROR_MESSAGE),
    );
  });

  it('should reject an unsafe request when the header has a wrong value', () => {
    expect(() => guard.canActivate(createContext('POST', WRONG_HEADER_VALUE))).toThrow(
      ForbiddenException,
    );
  });

  it('should allow the request when the context is not http', () => {
    expect(guard.canActivate(createContext('POST', undefined, WS_CONTEXT_TYPE))).toBe(true);
  });
});
