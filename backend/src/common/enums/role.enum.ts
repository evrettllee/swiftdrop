export const ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export const ROLE_NAMES = Object.values(ROLE);

export type RoleName = (typeof ROLE)[keyof typeof ROLE];
