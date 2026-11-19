import { type AdminUsersQuery } from '../api/admin-users-query';
import {
  ADMIN_USER_STATUS,
  ADMIN_USER_STATUSES,
  type AdminUserStatus,
  DEFAULT_USER_STATUSES,
  MANAGED_ROLE,
  type ManagedRole,
  USER_STATUS_FILTER_LABELS,
} from '../config/admin-user';
import { LIST_PAGE_SIZE } from '@/shared/lib/list-params';
import type { UsersParams } from '../config/list-params';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { VEHICLE_FILTER_LABELS } from '../config/vehicle-labels';

const LABEL_SEPARATOR = ', ';

export const APPLIED_FILTER = {
  SEARCH: 'q',
  STATUS: 'status',
  VEHICLE: 'vehicle',
} as const;

export type AppliedFilterId = (typeof APPLIED_FILTER)[keyof typeof APPLIED_FILTER];

export type AppliedFilter = {
  id: AppliedFilterId;
  name: string;
  value: string;
  reset: Partial<UsersParams>;
};

export const FILTERS_RESET: Partial<UsersParams> = {
  q: null,
  status: DEFAULT_USER_STATUSES,
  vehicle: [],
};

export function statusOptions(role: ManagedRole): AdminUserStatus[] {
  return ADMIN_USER_STATUSES.filter(
    (status) => role !== MANAGED_ROLE.CLIENT || status !== ADMIN_USER_STATUS.INVITED,
  );
}

function visibleStatuses(role: ManagedRole, status: readonly AdminUserStatus[]): AdminUserStatus[] {
  return statusOptions(role).filter((item) => status.includes(item));
}

export function isDefaultStatus(role: ManagedRole, status: readonly AdminUserStatus[]): boolean {
  return (
    visibleStatuses(role, status).join() === visibleStatuses(role, DEFAULT_USER_STATUSES).join()
  );
}

export function vehiclesOf(values: Pick<UsersParams, 'role' | 'vehicle'>) {
  return values.role === MANAGED_ROLE.COURIER ? values.vehicle : [];
}

export function toUsersQuery(
  values: UsersParams,
  page: number,
  until: number | null,
  limit: number = LIST_PAGE_SIZE,
): AdminUsersQuery {
  return {
    role: values.role,
    q: values.q,
    status: values.status,
    vehicle: vehiclesOf(values),
    sort: values.sort,
    page,
    limit,
    until,
  };
}

export function appliedFilters(values: UsersParams): AppliedFilter[] {
  const filters: AppliedFilter[] = [];
  const vehicles = vehiclesOf(values);

  if (values.q !== null) {
    filters.push({
      id: APPLIED_FILTER.SEARCH,
      name: TEXTS.SEARCH_CHIP,
      value: values.q,
      reset: { q: null },
    });
  }

  if (!isDefaultStatus(values.role, values.status)) {
    filters.push({
      id: APPLIED_FILTER.STATUS,
      name: TEXTS.STATUS,
      value: visibleStatuses(values.role, values.status)
        .map((status) => USER_STATUS_FILTER_LABELS[status])
        .join(LABEL_SEPARATOR),
      reset: { status: DEFAULT_USER_STATUSES },
    });
  }

  if (vehicles.length > 0) {
    filters.push({
      id: APPLIED_FILTER.VEHICLE,
      name: TEXTS.VEHICLE,
      value: vehicles.map((vehicle) => VEHICLE_FILTER_LABELS[vehicle]).join(LABEL_SEPARATOR),
      reset: { vehicle: [] },
    });
  }

  return filters;
}

export function filtersCount(values: UsersParams): number {
  return appliedFilters(values).filter(({ id }) => id !== APPLIED_FILTER.SEARCH).length;
}

export function tabPatch(role: ManagedRole): Partial<UsersParams> {
  return { role, vehicle: [] };
}
