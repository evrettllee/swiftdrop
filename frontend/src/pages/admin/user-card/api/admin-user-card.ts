import { z } from 'zod';
import {
  ADMIN_USER_STATUSES,
  INVITABLE_ROLES,
  type InvitableRole,
  MANAGED_ROLES,
} from '@/entities/admin-user';
import { type PasswordLink, passwordLinkSchema } from '@/features/password-link';
import { dateSchema, http, orderStatusSchema, VEHICLE_TYPE } from '@/shared/api';

const USERS_PATH = '/admin/users';

const personSchema = z.object({ firstName: z.string(), lastName: z.string() });

export type PersonName = z.infer<typeof personSchema>;

const historyEntrySchema = z.object({
  action: z.string(),
  at: dateSchema,
  actor: personSchema,
  details: z.object({
    role: z.enum(INVITABLE_ROLES).optional(),
    from: z.enum(INVITABLE_ROLES).optional(),
    to: z.enum(INVITABLE_ROLES).optional(),
    fields: z.array(z.string()).optional(),
    reason: z.string().optional(),
  }),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

const recentOrderSchema = z.object({
  orderId: z.number(),
  createdAt: dateSchema,
  from: z.string(),
  to: z.string(),
  price: z.number().nullable(),
  status: orderStatusSchema,
});

export type RecentOrder = z.infer<typeof recentOrderSchema>;

export const adminUserCardSchema = z.object({
  userId: z.number(),
  role: z.enum(MANAGED_ROLES),
  status: z.enum(ADMIN_USER_STATUSES),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  createdAt: dateSchema,
  lastLoginAt: dateSchema.nullable(),
  login: z.object({ password: z.boolean(), google: z.boolean(), yandex: z.boolean() }),
  block: z.object({ reason: z.string().nullable(), at: dateSchema, by: personSchema }).nullable(),
  invite: z.object({ sentAt: dateSchema, expiresAt: dateSchema }).nullable(),
  deletion: z.object({ at: dateSchema, by: personSchema }).nullable(),
  courier: z
    .object({
      vehicleType: z.enum(VEHICLE_TYPE).nullable(),
      deliveredCount: z.number(),
      cancelledCount: z.number(),
      isAvailable: z.boolean(),
      activeOrderId: z.number().nullable(),
    })
    .nullable(),
  orders: z.object({
    total: z.number(),
    delivered: z.number(),
    cancelled: z.number(),
    recent: z.array(recentOrderSchema),
  }),
  history: z.array(historyEntrySchema),
});

export type AdminUserCard = z.infer<typeof adminUserCardSchema>;

export type StaffChanges = { firstName: string; lastName: string; phone: string };

function userPath(userId: number, action = ''): string {
  return `${USERS_PATH}/${userId}${action}`;
}

async function cardOf(request: Promise<unknown>): Promise<AdminUserCard> {
  return adminUserCardSchema.parse(await request);
}

export function getAdminUserCard(userId: number, signal?: AbortSignal): Promise<AdminUserCard> {
  return cardOf(http.get(userPath(userId), { signal }));
}

export function updateStaff(userId: number, changes: StaffChanges): Promise<AdminUserCard> {
  return cardOf(http.patch(userPath(userId), changes));
}

export function changeRole(userId: number, role: InvitableRole): Promise<AdminUserCard> {
  return cardOf(http.post(userPath(userId, '/role'), { role }));
}

export function blockUser(userId: number, reason: string): Promise<AdminUserCard> {
  return cardOf(http.post(userPath(userId, '/block'), { reason }));
}

export function unblockUser(userId: number): Promise<AdminUserCard> {
  return cardOf(http.post(userPath(userId, '/unblock')));
}

export function endSessions(userId: number): Promise<AdminUserCard> {
  return cardOf(http.post(userPath(userId, '/sessions/revoke')));
}

export function deleteUser(userId: number): Promise<AdminUserCard> {
  return cardOf(http.delete(userPath(userId)));
}

export async function resetPassword(userId: number): Promise<PasswordLink> {
  return passwordLinkSchema.parse(await http.post(userPath(userId, '/password-reset')));
}

export async function resendInvite(userId: number): Promise<PasswordLink> {
  return passwordLinkSchema.parse(await http.post(userPath(userId, '/invite')));
}
