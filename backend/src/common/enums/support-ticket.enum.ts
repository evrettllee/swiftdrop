export const TICKET_TOPIC_VALUES = [
  'order_problem',
  'payment',
  'account',
  'client_unreachable',
  'app',
  'other',
] as const;

export type TicketTopic = (typeof TICKET_TOPIC_VALUES)[number];

export const TICKET_TOPIC = {
  ORDER_PROBLEM: 'order_problem',
  PAYMENT: 'payment',
  ACCOUNT: 'account',
  CLIENT_UNREACHABLE: 'client_unreachable',
  APP: 'app',
  OTHER: 'other',
} as const satisfies Record<string, TicketTopic>;

export const SUPPORT_TICKET_STATUS_VALUES = ['open', 'closed'] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUS_VALUES)[number];

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const satisfies Record<string, SupportTicketStatus>;
