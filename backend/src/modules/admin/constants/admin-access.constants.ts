import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';

export const ADMIN_ACCESS_ROUTES = {
  BLOCK: 'users/:userId/block',
  UNBLOCK: 'users/:userId/unblock',
  SESSIONS_REVOKE: 'users/:userId/sessions/revoke',
  PASSWORD_RESET: 'users/:userId/password-reset',
} as const;

export const BLOCK_REASON_MAX_LENGTH = 500;

export const CLIENT_OPEN_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
] as const;

export const ADMIN_ACCESS_MESSAGES = {
  REASON_REQUIRED: 'Укажите причину блокировки',
  REASON_TOO_LONG: `Причина не длиннее ${BLOCK_REASON_MAX_LENGTH} символов`,
  ALREADY_BLOCKED: 'Пользователь уже заблокирован',
  BLOCK_INVITED: 'Сотрудник ещё не принял приглашение. Если доступ не нужен, удалите его',
  BLOCK_ACTIVE_ORDER: 'Есть активный заказ. Заблокировать можно после его завершения',
  NOT_BLOCKED: 'Пользователь не заблокирован',
  SESSIONS_INVITED: 'У приглашённого сотрудника нет сеансов',
  RESET_CLIENT: 'Клиент меняет пароль сам через «Забыли пароль?»',
  RESET_INVITED: 'Сотрудник ещё не принял приглашение. Отправьте приглашение заново',
  RESET_BLOCKED: 'Сначала разблокируйте пользователя',
  RESET_ACTIVE_ORDER: 'Есть активный заказ. Сбросить пароль можно после его завершения',
  TOO_MANY_RESETS: 'Слишком много сбросов пароля. Подождите минуту',
} as const;

export const ADMIN_ACCESS_LOG_MESSAGES = {
  USER_BLOCKED: 'User blocked',
  USER_UNBLOCKED: 'User unblocked',
  SESSIONS_ENDED: 'User sessions ended',
  PASSWORD_RESET: 'Staff password reset',
} as const;

const PASSWORD_RESET_THROTTLE_LIMIT = 20;

export const PASSWORD_RESET_THROTTLE: UserThrottleOptions = {
  key: 'admin-password-reset',
  limit: PASSWORD_RESET_THROTTLE_LIMIT,
  ttlMs: MS_PER_MINUTE,
  message: ADMIN_ACCESS_MESSAGES.TOO_MANY_RESETS,
};
