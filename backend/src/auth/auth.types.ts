import type { RoleName } from '../common/enums/role.enum';

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

export type AuthResponse = Pick<AuthResult, 'user' | 'accessToken'>;
