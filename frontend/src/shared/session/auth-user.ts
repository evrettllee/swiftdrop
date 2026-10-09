import { z } from 'zod';

// Roles: must match the backend role names.
export const ROLE_VALUES = ['client', 'courier', 'manager', 'admin'] as const;

export const ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const satisfies Record<string, (typeof ROLE_VALUES)[number]>;

export type Role = (typeof ROLE_VALUES)[number];

// Responses of the backend

export const authUserSchema = z.object({
  userId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.enum(ROLE_VALUES),
});

export type AuthUser = z.infer<typeof authUserSchema>;

// Login, registration and refresh answer with { user }; /me answers with the user itself.
export const authResponseSchema = z.object({ user: authUserSchema });

// The bodies of the login and the registration requests; the parsed auth forms have this shape.
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
