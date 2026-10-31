import { MESSAGE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { SUPPORT_TICKET_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { ROLE } from '@/common/enums/role.enum';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';
import { TICKET_TOPIC, type TicketTopic } from '@/common/enums/support-ticket.enum';

export const TICKET_ID_ROUTE_PARAM = ':ticketId';

export const SUPPORT_ROUTES = {
  BASE: 'support/tickets',
  TICKET: TICKET_ID_ROUTE_PARAM,
  MESSAGES: `${TICKET_ID_ROUTE_PARAM}/messages`,
  READ: `${TICKET_ID_ROUTE_PARAM}/read`,
  CLOSE: `${TICKET_ID_ROUTE_PARAM}/close`,
} as const;

export const SUPPORT_AUTHOR_ROLES = [ROLE.CLIENT, ROLE.COURIER] as const;

export type SupportAuthorRole = (typeof SUPPORT_AUTHOR_ROLES)[number];

export const TICKET_TOPICS_BY_ROLE: Record<SupportAuthorRole, readonly TicketTopic[]> = {
  [ROLE.CLIENT]: [
    TICKET_TOPIC.ORDER_PROBLEM,
    TICKET_TOPIC.PAYMENT,
    TICKET_TOPIC.ACCOUNT,
    TICKET_TOPIC.OTHER,
  ],
  [ROLE.COURIER]: [
    TICKET_TOPIC.ORDER_PROBLEM,
    TICKET_TOPIC.CLIENT_UNREACHABLE,
    TICKET_TOPIC.APP,
    TICKET_TOPIC.OTHER,
  ],
};

export const TICKET_TOPIC_LABELS: Record<TicketTopic, string> = {
  [TICKET_TOPIC.ORDER_PROBLEM]: 'Проблема с заказом',
  [TICKET_TOPIC.PAYMENT]: 'Оплата',
  [TICKET_TOPIC.ACCOUNT]: 'Аккаунт',
  [TICKET_TOPIC.CLIENT_UNREACHABLE]: 'Клиент не выходит на связь',
  [TICKET_TOPIC.APP]: 'Работа приложения',
  [TICKET_TOPIC.OTHER]: 'Другое',
};

export const STAFF_AUTHOR_SUFFIX = 'поддержка';
export const LAST_MESSAGE_PREVIEW_LENGTH = 120;

export const SUPPORT_TICKETS_PAGE_SIZE_DEFAULT = 20;
export const SUPPORT_MESSAGES_PAGE_SIZE_DEFAULT = 30;

export const SUPPORT_ERROR_CODE = {
  TICKET_ALREADY_OPEN: 'TICKET_ALREADY_OPEN',
  TICKET_CLOSED: 'TICKET_CLOSED',
} as const;

export const SUPPORT_TEXT_LIMITS = {
  SUBJECT_MIN: SUPPORT_TICKET_FIELD_LENGTH.SUBJECT_MIN,
  SUBJECT_MAX: SUPPORT_TICKET_FIELD_LENGTH.SUBJECT,
  MESSAGE_MIN: 1,
  MESSAGE_MAX: MESSAGE_FIELD_LENGTH.CONTENT,
} as const;

export const SUPPORT_MESSAGES = {
  TICKET_ID_INVALID: 'Некорректный номер обращения',
  TOPIC_INVALID: 'Неизвестная тема обращения',
  TOPIC_NOT_ALLOWED: 'Эта тема недоступна для вашей роли',
  SUBJECT_REQUIRED: 'Для темы «Другое» укажите заголовок',
  SUBJECT_NOT_ALLOWED: 'Заголовок указывается только для темы «Другое»',
  SUBJECT_INVALID: `Заголовок: от ${SUPPORT_TICKET_FIELD_LENGTH.SUBJECT_MIN} до ${SUPPORT_TICKET_FIELD_LENGTH.SUBJECT} символов`,
  TEXT_INVALID: `Сообщение: от 1 до ${MESSAGE_FIELD_LENGTH.CONTENT} символов`,
  TEXT_FORBIDDEN_CHARACTER: 'Сообщение содержит недопустимый символ',
  ORDER_ID_INVALID: 'Некорректный номер заказа',
  STATUS_INVALID: 'Неизвестный статус обращения',
  TICKET_NOT_FOUND: 'Обращение не найдено',
  ORDER_NOT_FOUND: 'Заказ не найден',
  TICKET_ALREADY_OPEN: 'По этому заказу у вас уже есть открытое обращение',
  TICKET_CLOSED: 'Обращение закрыто',
  TOO_MANY_TICKETS: 'Слишком много новых обращений. Попробуйте позже',
  TOO_MANY_MESSAGES: 'Слишком много сообщений. Подождите минуту',
  BUSY: 'Обращение сейчас обновляется. Попробуйте ещё раз',
} as const;

export const SUPPORT_TICKET_CREATE_THROTTLE: UserThrottleOptions = {
  key: 'support-ticket-create',
  limit: 5,
  ttlMs: 60 * MS_PER_MINUTE,
  message: SUPPORT_MESSAGES.TOO_MANY_TICKETS,
};

export const SUPPORT_MESSAGE_THROTTLE: UserThrottleOptions = {
  key: 'support-message-send',
  limit: 20,
  ttlMs: MS_PER_MINUTE,
  message: SUPPORT_MESSAGES.TOO_MANY_MESSAGES,
};
