// Roles: must match the backend role names.
export const ROLE_VALUES = ['client', 'courier', 'manager', 'admin'] as const;

export const ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const satisfies Record<string, (typeof ROLE_VALUES)[number]>;

export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  GUEST: 'guest',
} as const;
