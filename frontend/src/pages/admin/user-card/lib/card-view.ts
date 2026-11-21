import { ADMIN_USER_STATUS, MANAGED_ROLE, type ManagedRole } from '@/entities/admin-user';
import { formatOrderNumber } from '@/entities/order';
import { APP_LOCALE } from '@/shared/config';
import { calendarToday } from '@/shared/lib/calendar';
import { formatShortDateTime, formatTime } from '@/shared/lib/format';
import { getAdminUsersPath } from '@/shared/routes';
import type { AdminUserCard } from '../api/admin-user-card';
import { USER_ACTION, type UserAction } from '../config/actions';
import {
  CARD_VALUE_TEXTS as VALUES,
  STATE_ALERT_TEXTS as ALERTS,
  USER_CARD_TEXTS,
} from '../config/texts';
import { formatDateTime } from './date-time';
import { personShort } from './history';

const ROLE_PARAM = 'role';
const LOGIN_LIST = new Intl.ListFormat(APP_LOCALE, { style: 'long', type: 'conjunction' });

type Courier = NonNullable<AdminUserCard['courier']>;

export type StateAlert = {
  variant: 'error' | 'info';
  kind: 'blocked' | 'invite' | 'deleted';
  title: string;
  text: string;
};

export function managementGroups(card: AdminUserCard): UserAction[][] {
  if (card.status === ADMIN_USER_STATUS.DELETED) {
    return [];
  }

  if (card.status === ADMIN_USER_STATUS.INVITED) {
    return [[USER_ACTION.EDIT, USER_ACTION.RESEND], [USER_ACTION.DELETE]];
  }

  const access =
    card.status === ADMIN_USER_STATUS.BLOCKED ? USER_ACTION.UNBLOCK : USER_ACTION.BLOCK;
  const first: UserAction[] =
    card.role === MANAGED_ROLE.CLIENT
      ? [USER_ACTION.SESSIONS]
      : [USER_ACTION.EDIT, USER_ACTION.ROLE, USER_ACTION.RESET, USER_ACTION.SESSIONS];

  return [first, [access, USER_ACTION.DELETE]];
}

export function loginMethods(card: AdminUserCard): string {
  if (card.status === ADMIN_USER_STATUS.DELETED) {
    return USER_CARD_TEXTS.DELETED_VALUE;
  }

  if (card.status === ADMIN_USER_STATUS.INVITED) {
    return VALUES.NO_PASSWORD_YET;
  }

  const methods = [
    card.login.password ? VALUES.PASSWORD : null,
    card.login.google ? VALUES.GOOGLE : null,
    card.login.yandex ? VALUES.YANDEX : null,
  ].filter((method) => method !== null);

  return methods.length === 0 ? VALUES.NO_LOGIN : LOGIN_LIST.format(methods);
}

export function courierNow(courier: Courier): string {
  if (courier.activeOrderId !== null) {
    return VALUES.carrying(formatOrderNumber(courier.activeOrderId));
  }

  return courier.isAvailable ? VALUES.ON_LINE : VALUES.OFF_LINE;
}

export function ordersSummary(card: AdminUserCard): string | null {
  const { total, delivered, cancelled, recent } = card.orders;

  if (recent.length === 0) {
    return null;
  }

  const parts =
    card.role === MANAGED_ROLE.COURIER
      ? [VALUES.deliveredFirst(delivered)]
      : [VALUES.total(total), delivered > 0 ? VALUES.delivered(delivered) : null];

  return [...parts, cancelled > 0 ? VALUES.cancelled(cancelled) : null]
    .filter((part) => part !== null)
    .join(', ');
}

export function lastLoginText(lastLoginAt: Date | null, now: Date): string {
  if (lastLoginAt === null) {
    return VALUES.NO_LOGIN_YET;
  }

  return calendarToday(lastLoginAt) === calendarToday(now)
    ? `${VALUES.TODAY}, ${formatTime(lastLoginAt)}`
    : formatDateTime(lastLoginAt);
}

export function listPathOf(role: ManagedRole, listSearch: string): string {
  const listRole = new URLSearchParams(listSearch).get(ROLE_PARAM) ?? MANAGED_ROLE.CLIENT;

  if (listSearch !== '' && listRole === role) {
    return getAdminUsersPath(listSearch);
  }

  return getAdminUsersPath(new URLSearchParams({ [ROLE_PARAM]: role }).toString());
}

function sentence(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

function blockedAlert(block: NonNullable<AdminUserCard['block']>): StateAlert {
  const reason = block.reason === null || block.reason === '' ? [] : [sentence(ALERTS.reason(block.reason))];

  return {
    variant: 'error',
    kind: 'blocked',
    title: ALERTS.blocked(formatDateTime(block.at)),
    text: [...reason, ALERTS.blockedBy(personShort(block.by))].join(' '),
  };
}

function inviteAlert(invite: AdminUserCard['invite']): StateAlert {
  return invite === null
    ? {
        variant: 'info',
        kind: 'invite',
        title: ALERTS.INVITE_EXPIRED,
        text: ALERTS.INVITE_EXPIRED_TEXT,
      }
    : {
        variant: 'info',
        kind: 'invite',
        title: ALERTS.invited(formatDateTime(invite.sentAt)),
        text: ALERTS.inviteUntil(formatShortDateTime(invite.expiresAt)),
      };
}

function deletedAlert(deletion: AdminUserCard['deletion']): StateAlert {
  return {
    variant: 'info',
    kind: 'deleted',
    title: deletion === null ? ALERTS.DELETED : ALERTS.deleted(formatDateTime(deletion.at)),
    text:
      deletion === null
        ? ALERTS.DELETED_TEXT
        : `${ALERTS.DELETED_TEXT} ${ALERTS.deletedBy(personShort(deletion.by))}`,
  };
}

export function stateAlert(card: AdminUserCard): StateAlert | null {
  if (card.status === ADMIN_USER_STATUS.DELETED) {
    return deletedAlert(card.deletion);
  }

  if (card.status === ADMIN_USER_STATUS.INVITED) {
    return inviteAlert(card.invite);
  }

  return card.status === ADMIN_USER_STATUS.BLOCKED && card.block !== null
    ? blockedAlert(card.block)
    : null;
}
