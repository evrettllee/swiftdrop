import { SUPPORT_TOPIC, type NewTicket, type SupportTopic } from '@/shared/support-api';
import { NEW_TICKET_TEXTS } from '../config/new-ticket';

export type NewTicketDraft = {
  topic: SupportTopic;
  subject: string;
  orderId: number | null;
  message: string;
};

export type NewTicketField = 'subject' | 'message';

export type NewTicketErrors = Partial<Record<NewTicketField, string>>;

const ID_PARAM_PATTERN = /^[1-9]\d{0,9}$/;
const MAX_ID = 2_147_483_647;

export function needsSubject(topic: SupportTopic): boolean {
  return topic === SUPPORT_TOPIC.OTHER;
}

export function validateDraft(draft: NewTicketDraft): NewTicketErrors {
  const errors: NewTicketErrors = {};

  if (needsSubject(draft.topic) && draft.subject.trim() === '') {
    errors.subject = NEW_TICKET_TEXTS.SUBJECT_REQUIRED;
  }

  if (draft.message.trim() === '') {
    errors.message = NEW_TICKET_TEXTS.MESSAGE_REQUIRED;
  }

  return errors;
}

export function toNewTicket(draft: NewTicketDraft): NewTicket {
  return {
    topic: draft.topic,
    subject: needsSubject(draft.topic) ? draft.subject.trim() : null,
    orderId: draft.orderId,
    message: draft.message.trim(),
  };
}

export function parseIdParam(raw: string | null): number | null {
  if (raw === null || !ID_PARAM_PATTERN.test(raw)) {
    return null;
  }

  const id = Number(raw);

  return id <= MAX_ID ? id : null;
}

export function withChosenOrder<T extends { orderId: number }>(
  orders: readonly T[],
  orderId: number | null,
  fallback: (orderId: number) => T,
): T[] {
  return orderId === null || orders.some((order) => order.orderId === orderId)
    ? [...orders]
    : [fallback(orderId), ...orders];
}
