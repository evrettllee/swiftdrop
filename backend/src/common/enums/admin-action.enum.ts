export const ADMIN_ACTION_VALUES = [
  'staff_invited',
  'invite_resent',
  'user_updated',
  'role_changed',
  'password_reset',
  'sessions_ended',
  'user_blocked',
  'user_unblocked',
  'user_deleted',
  'staff_purged',
  'tariff_created',
  'tariff_updated',
  'tariff_enabled',
  'tariff_disabled',
] as const;

export type AdminAction = (typeof ADMIN_ACTION_VALUES)[number];

export const ADMIN_ACTION = {
  STAFF_INVITED: 'staff_invited',
  INVITE_RESENT: 'invite_resent',
  USER_UPDATED: 'user_updated',
  ROLE_CHANGED: 'role_changed',
  PASSWORD_RESET: 'password_reset',
  SESSIONS_ENDED: 'sessions_ended',
  USER_BLOCKED: 'user_blocked',
  USER_UNBLOCKED: 'user_unblocked',
  USER_DELETED: 'user_deleted',
  STAFF_PURGED: 'staff_purged',
  TARIFF_CREATED: 'tariff_created',
  TARIFF_UPDATED: 'tariff_updated',
  TARIFF_ENABLED: 'tariff_enabled',
  TARIFF_DISABLED: 'tariff_disabled',
} as const satisfies Record<string, AdminAction>;
