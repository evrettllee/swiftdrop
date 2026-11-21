import {
  ArrowsLeftRightIcon,
  EnvelopeSimpleIcon,
  type Icon,
  KeyIcon,
  LockSimpleOpenIcon,
  PencilSimpleIcon,
  ProhibitIcon,
  SignOutIcon,
  TrashIcon,
} from '@phosphor-icons/react';

export const USER_ACTION = {
  EDIT: 'edit',
  ROLE: 'role',
  RESET: 'reset',
  SESSIONS: 'sessions',
  RESEND: 'resend',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  DELETE: 'delete',
} as const;

export type UserAction = (typeof USER_ACTION)[keyof typeof USER_ACTION];

export const ACTION_BUTTONS: Record<UserAction, { label: string; icon: Icon }> = {
  edit: { label: 'Изменить данные', icon: PencilSimpleIcon },
  role: { label: 'Сменить роль', icon: ArrowsLeftRightIcon },
  reset: { label: 'Сбросить пароль', icon: KeyIcon },
  sessions: { label: 'Завершить все сеансы', icon: SignOutIcon },
  resend: { label: 'Отправить приглашение заново', icon: EnvelopeSimpleIcon },
  block: { label: 'Заблокировать', icon: ProhibitIcon },
  unblock: { label: 'Разблокировать', icon: LockSimpleOpenIcon },
  delete: { label: 'Удалить', icon: TrashIcon },
};

export const LINK_KIND = {
  RESET: 'reset',
  RESEND: 'resend',
} as const;

export type LinkKind = (typeof LINK_KIND)[keyof typeof LINK_KIND];
