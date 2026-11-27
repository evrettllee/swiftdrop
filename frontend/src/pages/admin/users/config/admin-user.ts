import { ADMIN_USER_STATUS, type AdminUserStatus } from '@/entities/admin-user';
import { VEHICLE_TYPE } from '@/shared/api';

export const DEFAULT_USER_STATUSES: readonly AdminUserStatus[] = [
  ADMIN_USER_STATUS.ACTIVE,
  ADMIN_USER_STATUS.INVITED,
  ADMIN_USER_STATUS.BLOCKED,
];

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
