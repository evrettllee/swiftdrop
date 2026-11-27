import { AUTH_API_PATHS, http, type HttpOptions } from '@/shared/api';
import {
  authResponseSchema,
  type AuthUser,
  authUserSchema,
  type LoginInput,
  type RegisterInput,
} from './auth-user';
import { type PasswordLink, passwordLinkSchema } from './password-link';

export async function fetchCurrentUser(): Promise<AuthUser> {
  return authUserSchema.parse(await http.get(AUTH_API_PATHS.ME));
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = authResponseSchema.parse(await http.post(AUTH_API_PATHS.LOGIN, input));

  return response.user;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = authResponseSchema.parse(await http.post(AUTH_API_PATHS.REGISTER, input));

  return response.user;
}

export async function logout(): Promise<void> {
  await http.post(AUTH_API_PATHS.LOGOUT);
}

function passwordLinkPath(token: string): string {
  return `${AUTH_API_PATHS.PASSWORD_LINKS}/${encodeURIComponent(token)}`;
}

export async function fetchPasswordLink(
  token: string,
  options: HttpOptions = {},
): Promise<PasswordLink> {
  return passwordLinkSchema.parse(await http.get(passwordLinkPath(token), options));
}

export async function setPasswordByLink(token: string, password: string): Promise<AuthUser> {
  return authUserSchema.parse(await http.post(passwordLinkPath(token), { password }));
}
