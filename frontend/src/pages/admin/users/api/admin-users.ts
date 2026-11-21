import { z } from 'zod';
import { dateSchema, http, VEHICLE_TYPE } from '@/shared/api';
import { ADMIN_USER_STATUSES } from '@/entities/admin-user';
import {
  type AdminUserCountsQuery,
  type AdminUsersQuery,
  buildAdminUserCountsQuery,
  buildAdminUsersQuery,
} from './admin-users-query';
import { ADMIN_USERS_API_PATHS } from './paths';

export const adminUserListItemSchema = z.object({
  userId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.enum(ADMIN_USER_STATUSES),
  createdAt: dateSchema,
  lastLoginAt: dateSchema.nullable(),
  ordersCount: z.number().optional(),
  vehicleType: z.enum(VEHICLE_TYPE).nullable().optional(),
  deliveredCount: z.number().optional(),
});

export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;

export const adminUsersPageSchema = z.object({
  items: z.array(adminUserListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  until: z.number().nullable(),
});

export type AdminUsersPage = z.infer<typeof adminUsersPageSchema>;

export const adminUserCountsSchema = z.object({
  client: z.number(),
  courier: z.number(),
  manager: z.number(),
});

export type AdminUserCounts = z.infer<typeof adminUserCountsSchema>;

export async function getAdminUsers(
  query: AdminUsersQuery,
  signal?: AbortSignal,
): Promise<AdminUsersPage> {
  const search = buildAdminUsersQuery(query);

  return adminUsersPageSchema.parse(
    await http.get(`${ADMIN_USERS_API_PATHS.USERS}?${search.toString()}`, { signal }),
  );
}

export async function getAdminUserCounts(
  query: AdminUserCountsQuery,
  signal?: AbortSignal,
): Promise<AdminUserCounts> {
  const search = buildAdminUserCountsQuery(query);

  return adminUserCountsSchema.parse(
    await http.get(`${ADMIN_USERS_API_PATHS.COUNTS}?${search.toString()}`, { signal }),
  );
}
