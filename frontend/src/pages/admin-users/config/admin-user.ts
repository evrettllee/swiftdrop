import { VEHICLE_TYPE } from '@/shared/api';

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

export const DEFAULT_USER_STATUSES: readonly AdminUserStatus[] = [
  ADMIN_USER_STATUS.ACTIVE,
  ADMIN_USER_STATUS.INVITED,
  ADMIN_USER_STATUS.BLOCKED,
];

export const USER_STATUS_LABELS: Record<AdminUserStatus, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  invited: 'Приглашён',
  deleted: 'Удалён',
};

export const USER_STATUS_FILTER_LABELS: Record<AdminUserStatus, string> = {
  active: 'Активные',
  blocked: 'Заблокированные',
  invited: 'Приглашённые',
  deleted: 'Удалённые',
};

export const VEHICLE_FILTER_NONE = 'none';

export const ADMIN_VEHICLE_FILTERS = [
  VEHICLE_TYPE.FOOT,
  VEHICLE_TYPE.BICYCLE,
  VEHICLE_TYPE.SCOOTER,
  VEHICLE_TYPE.CAR,
  VEHICLE_TYPE.TRUCK,
  VEHICLE_FILTER_NONE,
] as const;

export type AdminVehicleFilter = (typeof ADMIN_VEHICLE_FILTERS)[number];

export const NO_VEHICLE_LABEL = 'Не указан';

export const ADMIN_USER_SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  NAME: 'name',
} as const;

export const ADMIN_USER_SORTS = [
  ADMIN_USER_SORT.NEWEST,
  ADMIN_USER_SORT.OLDEST,
  ADMIN_USER_SORT.NAME,
] as const;

export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number];

export const ADMIN_SEARCH_MAX_LENGTH = 100;
