import {
  ArrowsLeftRightIcon,
  EnvelopeSimpleIcon,
  type Icon,
  KeyIcon,
  LockSimpleOpenIcon,
  PencilSimpleIcon,
  ProhibitIcon,
  SignOutIcon,
  UserMinusIcon,
} from '@phosphor-icons/react';

export const HISTORY_ACTION = {
  STAFF_INVITED: 'staff_invited',
  INVITE_RESENT: 'invite_resent',
  USER_UPDATED: 'user_updated',
  ROLE_CHANGED: 'role_changed',
  PASSWORD_RESET: 'password_reset',
  SESSIONS_ENDED: 'sessions_ended',
  USER_BLOCKED: 'user_blocked',
  USER_UNBLOCKED: 'user_unblocked',
  USER_DELETED: 'user_deleted',
} as const;

export type HistoryAction = (typeof HISTORY_ACTION)[keyof typeof HISTORY_ACTION];

export const HISTORY_TITLES: Record<HistoryAction, string> = {
  staff_invited: 'Приглашение отправлено',
  invite_resent: 'Приглашение отправлено заново',
  user_updated: 'Изменены данные',
  role_changed: 'Роль изменена',
  password_reset: 'Пароль сброшен',
  sessions_ended: 'Завершены все сеансы',
  user_blocked: 'Заблокирован',
  user_unblocked: 'Разблокирован',
  user_deleted: 'Удалён, данные обезличены',
};

export const HISTORY_ICONS: Record<HistoryAction, Icon> = {
  staff_invited: EnvelopeSimpleIcon,
  invite_resent: EnvelopeSimpleIcon,
  user_updated: PencilSimpleIcon,
  role_changed: ArrowsLeftRightIcon,
  password_reset: KeyIcon,
  sessions_ended: SignOutIcon,
  user_blocked: ProhibitIcon,
  user_unblocked: LockSimpleOpenIcon,
  user_deleted: UserMinusIcon,
};

export const HISTORY_DETAIL_TEXTS = {
  role: (role: string) => `Роль: ${role}`,
  roleChange: (from: string, to: string) => `${from} → ${to}`,
  reason: (reason: string) => `Причина: ${reason}`,
  PASSWORD_RESET: 'Ссылка для нового пароля отправлена на почту',
  USER_DELETED: 'Заказы и переписка сохранены',
} as const;

export const ROLE_NAMES: Record<string, string> = {
  courier: 'курьер',
  manager: 'менеджер',
};

export const FIELD_NAMES: Record<string, string> = {
  firstName: 'имя',
  lastName: 'фамилия',
  phone: 'телефон',
};
