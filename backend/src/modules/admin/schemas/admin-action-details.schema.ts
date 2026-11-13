import { z } from 'zod';
import { ADMIN_ACTION, type AdminAction } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { MANAGED_ROLES } from '../constants/admin-users.constants';

const emptyDetails = z.object({});
const managedRole = z.enum(MANAGED_ROLES);
const fieldChange = z.object({
  from: z.string().nullable(),
  to: z.string().nullable(),
});

export const ADMIN_ACTION_DETAILS = {
  [ADMIN_ACTION.STAFF_INVITED]: z.object({ role: z.enum([ROLE.COURIER, ROLE.MANAGER]) }),
  [ADMIN_ACTION.INVITE_RESENT]: emptyDetails,
  [ADMIN_ACTION.USER_UPDATED]: z.object({ changes: z.record(z.string(), fieldChange) }),
  [ADMIN_ACTION.ROLE_CHANGED]: z.object({ from: managedRole, to: managedRole }),
  [ADMIN_ACTION.PASSWORD_RESET]: emptyDetails,
  [ADMIN_ACTION.SESSIONS_ENDED]: emptyDetails,
  [ADMIN_ACTION.USER_BLOCKED]: z.object({ reason: z.string() }),
  [ADMIN_ACTION.USER_UNBLOCKED]: emptyDetails,
  [ADMIN_ACTION.USER_DELETED]: emptyDetails,
} as const satisfies Partial<Record<AdminAction, z.ZodType>>;

type DetailsSchemas = typeof ADMIN_ACTION_DETAILS;

export type AdminActionDetails = {
  [K in keyof DetailsSchemas]: z.infer<DetailsSchemas[K]>;
};

export type AnyAdminActionDetails =
  AdminActionDetails[keyof AdminActionDetails] | Record<string, never>;

function schemaOf(action: AdminAction): z.ZodType | undefined {
  return Object.hasOwn(ADMIN_ACTION_DETAILS, action)
    ? ADMIN_ACTION_DETAILS[action as keyof DetailsSchemas]
    : undefined;
}

export function parseActionDetails(action: AdminAction, raw: unknown): AnyAdminActionDetails {
  const parsed = schemaOf(action)?.safeParse(raw);

  return parsed?.success ? (parsed.data as AnyAdminActionDetails) : {};
}
