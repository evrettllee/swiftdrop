import type { Request, Response } from 'express';
import { OAUTH_PROVIDER, type OAuthProvider } from '../../../common/enums/oauth-provider.enum';
import type { AuthCookiesService } from './auth-cookies.service';
import { OAuthStateService } from './oauth-state.service';

const PROVIDER = OAUTH_PROVIDER.GOOGLE;
const STORED_STATE = 'stored-state';
const OTHER_STATE = 'other-state';

function createCookiesMock() {
  return {
    setOAuthState: jest.fn<void, [Response, OAuthProvider, string]>(),
    clearOAuthState: jest.fn<void, [Response, OAuthProvider]>(),
    getOAuthState: jest.fn<string | undefined, [Request, OAuthProvider]>(),
  };
}

function createRequest(state: unknown): Request {
  return { query: { state } } as unknown as Request;
}

describe('OAuthStateService', () => {
  const response = {} as Response;
  let cookies: ReturnType<typeof createCookiesMock>;
  let service: OAuthStateService;

  beforeEach(() => {
    cookies = createCookiesMock();
    service = new OAuthStateService(cookies as unknown as AuthCookiesService);
  });

  it('should return the state and store it in a cookie when issuing', () => {
    const state = service.issue(response, PROVIDER);

    expect(state.length).toBeGreaterThan(0);
    expect(cookies.setOAuthState).toHaveBeenCalledWith(response, PROVIDER, state);
  });

  it('should return a different state each time when issuing twice', () => {
    expect(service.issue(response, PROVIDER)).not.toBe(service.issue(response, PROVIDER));
  });

  it('should return true when the cookie matches the state in the query', () => {
    cookies.getOAuthState.mockReturnValue(STORED_STATE);

    expect(service.verify(createRequest(STORED_STATE), response, PROVIDER)).toBe(true);
  });

  it('should return false when the state in the query differs from the cookie', () => {
    cookies.getOAuthState.mockReturnValue(STORED_STATE);

    expect(service.verify(createRequest(OTHER_STATE), response, PROVIDER)).toBe(false);
  });

  it('should return false when the cookie is missing', () => {
    cookies.getOAuthState.mockReturnValue(undefined);

    expect(service.verify(createRequest(STORED_STATE), response, PROVIDER)).toBe(false);
  });

  it('should return false when the query has no state', () => {
    cookies.getOAuthState.mockReturnValue(STORED_STATE);

    expect(service.verify(createRequest(undefined), response, PROVIDER)).toBe(false);
  });

  it('should return false when the state in the query is not a plain string', () => {
    cookies.getOAuthState.mockReturnValue(STORED_STATE);

    expect(service.verify(createRequest([STORED_STATE]), response, PROVIDER)).toBe(false);
  });

  it('should clear the cookie when verifying, whether or not the check passes', () => {
    cookies.getOAuthState.mockReturnValue(STORED_STATE);

    service.verify(createRequest(STORED_STATE), response, PROVIDER);
    service.verify(createRequest(OTHER_STATE), response, PROVIDER);

    expect(cookies.clearOAuthState).toHaveBeenCalledTimes(2);
  });
});
