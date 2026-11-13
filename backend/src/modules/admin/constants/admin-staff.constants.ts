import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';

export const ADMIN_STAFF_ROUTES = {
  STAFF: 'staff',
  USER_INVITE: 'users/:userId/invite',
  USER_ROLE: 'users/:userId/role',
} as const;

export const ADMIN_ROLE_MESSAGES = {
  CLIENT_ROLE_LOCKED: 'Роль клиента изменить нельзя',
  SAME_ROLE: 'У пользователя уже эта роль',
  ACTIVE_ORDER: 'Есть активный заказ. Сменить роль можно после его завершения',
} as const;

export const STAFF_EDITABLE_FIELDS = ['firstName', 'lastName', 'phone'] as const;

export const ADMIN_STAFF_MESSAGES = {
  ROLE_INVALID: 'Укажите роль: courier или manager',
  NOTHING_TO_UPDATE: 'Укажите хотя бы одно поле: firstName, lastName или phone',
  INVITE_ONLY_INVITED: 'Приглашение можно отправить только приглашённому сотруднику',
  CLIENT_EDIT_FORBIDDEN: 'Данные клиента может изменить только он сам',
  USER_DELETED: 'Пользователь удалён',
  USER_BUSY: 'Пользователь сейчас изменяется. Попробуйте ещё раз',
  TOO_MANY_INVITES: 'Слишком много приглашений. Подождите минуту',
} as const;

export const ADMIN_STAFF_LOG_MESSAGES = {
  INVITE_MAIL_FAILED: 'Invitation mail not sent',
  USER_BUSY: 'Admin change waited too long for the user row',
  ROLE_CHANGED: 'Staff role changed',
  OFFERS_CLOSE_FAILED: 'Open offers not closed after a role change',
} as const;

const INVITE_THROTTLE_LIMIT = 20;

export const STAFF_INVITE_THROTTLE: UserThrottleOptions = {
  key: 'admin-staff-invite',
  limit: INVITE_THROTTLE_LIMIT,
  ttlMs: MS_PER_MINUTE,
  message: ADMIN_STAFF_MESSAGES.TOO_MANY_INVITES,
};

export const STAFF_RESEND_THROTTLE: UserThrottleOptions = {
  key: 'admin-staff-resend',
  limit: INVITE_THROTTLE_LIMIT,
  ttlMs: MS_PER_MINUTE,
  message: ADMIN_STAFF_MESSAGES.TOO_MANY_INVITES,
};
