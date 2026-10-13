import type { Request } from 'express';
import type { OAuthProvider } from '../../../common/enums/oauth-provider.enum';
import type { RoleName } from '../../../common/enums/role.enum';

export type AccessTokenPayload = {
  sub: string;
  role: RoleName;
};

export type AuthUser = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: RoleName;
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

// Tokens travel only in httpOnly cookies, so the response body carries just the user.
export type AuthResponse = Pick<AuthResult, 'user'>;

export type OAuthProfile = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

export type OAuthRequest = Request & { user: OAuthProfile };
