import {
  type ArgumentsHost,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  OAUTH_BLOCKED_REDIRECT,
  OAUTH_FAILURE_REDIRECT,
  OAUTH_INVITE_PENDING_REDIRECT,
} from '../constants/oauth.constants';
import { InvitePendingException } from '../errors/invite-pending.exception';
import { OAuthFailureFilter } from './oauth-failure.filter';

function hostWith(redirect: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({ getResponse: () => ({ redirect }) }),
  } as unknown as ArgumentsHost;
}

describe('OAuthFailureFilter', () => {
  const filter = new OAuthFailureFilter();
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it.each<[string, unknown, string]>([
    ['an invited staff member', new InvitePendingException(), OAUTH_INVITE_PENDING_REDIRECT],
    ['a blocked account', new ForbiddenException(), OAUTH_BLOCKED_REDIRECT],
    ['any other failure', new UnauthorizedException(), OAUTH_FAILURE_REDIRECT],
  ])('should redirect to the right error when the sign-in fails for %s', (_case, error, url) => {
    const redirect = jest.fn();

    filter.catch(error, hostWith(redirect));

    expect(redirect).toHaveBeenCalledWith(url);
  });

  it('should log only the name of an error that is not an HTTP error', () => {
    const error = new Error('Failed query: insert params: person@example.com');

    filter.catch(error, hostWith(jest.fn()));

    expect(warn.mock.calls.flat().join(' ')).not.toContain('person@example.com');
  });
});
