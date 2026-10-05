import type { z } from 'zod';
import type { AUTH_STATUS, AUTH_TAB, ROLE_VALUES } from './constants';
import type { authUserSchema } from './schemas';

export type AuthUser = z.infer<typeof authUserSchema>;
export type Role = (typeof ROLE_VALUES)[number];
export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];
export type AuthTabId = (typeof AUTH_TAB)[keyof typeof AUTH_TAB];

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};
