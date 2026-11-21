import { z } from 'zod';
import {
  ADMIN_USER_STATUSES,
  type AdminUserStatus,
  MANAGED_ROLE,
  MANAGED_ROLES,
  type ManagedRole,
} from '@/entities/admin-user';
import {
  ADMIN_SEARCH_MAX_LENGTH,
  ADMIN_USER_SORT,
  ADMIN_USER_SORTS,
  ADMIN_VEHICLE_FILTERS,
  type AdminUserSort,
  type AdminVehicleFilter,
  DEFAULT_USER_STATUSES,
} from './admin-user';
import { LIST_PARAM_SEPARATOR, type ListParamsConfig } from '@/shared/lib/list-params';

const PAGE_MAX = 10_000;

export type UsersParams = {
  role: ManagedRole;
  q: string | null;
  status: readonly AdminUserStatus[];
  vehicle: readonly AdminVehicleFilter[];
  sort: AdminUserSort;
  page: number;
};

function inOrder<T extends string>(order: readonly T[]) {
  return (values: readonly T[]): T[] => order.filter((value) => values.includes(value));
}

export const orderStatuses = inOrder<AdminUserStatus>(ADMIN_USER_STATUSES);
export const orderVehicles = inOrder<AdminVehicleFilter>(ADMIN_VEHICLE_FILTERS);

function csvOf<T extends string>(values: readonly [T, ...T[]], order: (items: T[]) => T[]) {
  return z
    .string()
    .transform((raw) => raw.split(LIST_PARAM_SEPARATOR))
    .pipe(z.array(z.enum(values)).min(1))
    .transform(order);
}

export const USERS_PARAMS_CONFIG: ListParamsConfig<UsersParams> = {
  schema: z.object({
    role: z.enum(MANAGED_ROLES),
    q: z.string().trim().min(1).max(ADMIN_SEARCH_MAX_LENGTH),
    status: csvOf(ADMIN_USER_STATUSES, orderStatuses),
    vehicle: csvOf(ADMIN_VEHICLE_FILTERS, orderVehicles),
    sort: z.enum(ADMIN_USER_SORTS),
    page: z.coerce.number().int().min(1).max(PAGE_MAX),
  }),
  defaults: {
    role: MANAGED_ROLE.CLIENT,
    q: null,
    status: DEFAULT_USER_STATUSES,
    vehicle: [],
    sort: ADMIN_USER_SORT.NEWEST,
    page: 1,
  },
  pageKey: 'page',
  searchKey: 'q',
};
