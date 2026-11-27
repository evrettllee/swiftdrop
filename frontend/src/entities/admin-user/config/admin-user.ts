export const MANAGED_ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
  MANAGER: 'manager',
} as const;

export const MANAGED_ROLES = [
  MANAGED_ROLE.CLIENT,
  MANAGED_ROLE.COURIER,
  MANAGED_ROLE.MANAGER,
] as const;

export type ManagedRole = (typeof MANAGED_ROLES)[number];

export const INVITABLE_ROLES = [MANAGED_ROLE.COURIER, MANAGED_ROLE.MANAGER] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ADMIN_USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  INVITED: 'invited',
  DELETED: 'deleted',
} as const;

export const ADMIN_USER_STATUSES = [
  ADMIN_USER_STATUS.ACTIVE,
  ADMIN_USER_STATUS.INVITED,
  ADMIN_USER_STATUS.BLOCKED,
  ADMIN_USER_STATUS.DELETED,
] as const;

export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export const USER_STATUS_LABELS: Record<AdminUserStatus, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  invited: 'Приглашён',
  deleted: 'Удалён',
};

export const ROLE_LABELS: Record<ManagedRole, string> = {
  client: 'Клиент',
  courier: 'Курьер',
  manager: 'Менеджер',
};

export const NO_VEHICLE_LABEL = 'Не указан';
