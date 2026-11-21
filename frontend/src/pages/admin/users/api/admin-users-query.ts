import { type AdminUserStatus, MANAGED_ROLE, type ManagedRole } from '@/entities/admin-user';
import { type AdminUserSort, type AdminVehicleFilter } from '../config/admin-user';

const LIST_SEPARATOR = ',';

export type AdminUserCountsQuery = {
  status: readonly AdminUserStatus[];
  q: string | null;
};

export type AdminUsersQuery = AdminUserCountsQuery & {
  role: ManagedRole;
  vehicle: readonly AdminVehicleFilter[];
  sort: AdminUserSort;
  page: number;
  limit: number;
  until: number | null;
};

export function buildAdminUserCountsQuery({ status, q }: AdminUserCountsQuery): URLSearchParams {
  const search = new URLSearchParams();

  if (status.length > 0) {
    search.set('status', status.join(LIST_SEPARATOR));
  }

  if (q !== null) {
    search.set('q', q);
  }

  return search;
}

export function buildAdminUsersQuery(query: AdminUsersQuery): URLSearchParams {
  const search = new URLSearchParams({ role: query.role });

  for (const [key, value] of buildAdminUserCountsQuery(query)) {
    search.set(key, value);
  }

  if (query.role === MANAGED_ROLE.COURIER && query.vehicle.length > 0) {
    search.set('vehicle', query.vehicle.join(LIST_SEPARATOR));
  }

  search.set('sort', query.sort);
  search.set('page', String(query.page));
  search.set('limit', String(query.limit));

  if (query.until !== null) {
    search.set('until', String(query.until));
  }

  return search;
}
