import type { Request } from 'express';
import type { OAuthProvider } from '../common/enums/oauth-provider.enum';

export type OAuthProfile = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

export type OAuthRequest = Request & { user: OAuthProfile };
