import { SORT_DIRECTION } from '@/common/constants/list.constants';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { ROLE } from '@/common/enums/role.enum';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';
import { SUPPORT_MESSAGES, TICKET_ID_ROUTE_PARAM } from './support.constants';

export const SUPPORT_STAFF_ROUTES = {
  BASE: 'manager/support',
  TICKETS: 'tickets',
  COUNTS: 'counts',
  TICKET: `tickets/${TICKET_ID_ROUTE_PARAM}`,
  MESSAGES: `tickets/${TICKET_ID_ROUTE_PARAM}/messages`,
  READ: `tickets/${TICKET_ID_ROUTE_PARAM}/read`,
  CLOSE: `tickets/${TICKET_ID_ROUTE_PARAM}/close`,
} as const;

export const SUPPORT_VIEW = {
  AWAITING: 'awaiting',
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export const SUPPORT_VIEW_VALUES = [
  SUPPORT_VIEW.AWAITING,
  SUPPORT_VIEW.OPEN,
  SUPPORT_VIEW.CLOSED,
] as const;

export type SupportView = (typeof SUPPORT_VIEW_VALUES)[number];

export const SUPPORT_AUTHOR_ROLE_VALUES = [ROLE.CLIENT, ROLE.COURIER] as const;

export const SUPPORT_STAFF_PAGE_SIZE_DEFAULT = 20;

export const SUPPORT_QUEUE_DEFAULT_DIRECTION = {
  [SUPPORT_VIEW.AWAITING]: SORT_DIRECTION.ASC,
  [SUPPORT_VIEW.OPEN]: SORT_DIRECTION.DESC,
  [SUPPORT_VIEW.CLOSED]: SORT_DIRECTION.DESC,
} as const;

export const SUPPORT_STAFF_MESSAGE_THROTTLE: UserThrottleOptions = {
  key: 'support-staff-message-send',
  limit: 60,
  ttlMs: MS_PER_MINUTE,
  message: SUPPORT_MESSAGES.TOO_MANY_MESSAGES,
};

export const CLOSED_BY = {
  AUTHOR: 'author',
  STAFF: 'staff',
} as const;

export const SUPPORT_STAFF_MESSAGES = {
  VIEW_INVALID: 'Неизвестный раздел очереди',
  AUTHOR_ROLE_INVALID: 'Неизвестная роль автора',
} as const;
