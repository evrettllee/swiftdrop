import { AUTH_API_PATHS } from '../../shared/constants/api';
import { http } from '../../shared/api/http';
import { authResponseSchema, authUserSchema } from './schemas';
import type { AuthUser, LoginInput, RegisterInput } from './types';

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
