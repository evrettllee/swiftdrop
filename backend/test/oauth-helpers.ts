import type { OAuthProfile } from '../src/auth/oauth.types';
import { OAUTH_PROVIDER } from '../src/common/enums/oauth-provider.enum';
import { validRegistration } from './auth-helpers';

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
