import { AUTH_API_PATHS, http } from '@/shared/api';
import {
  authResponseSchema,
  type AuthUser,
  authUserSchema,
  type LoginInput,
  type RegisterInput,
} from './auth-user';

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
