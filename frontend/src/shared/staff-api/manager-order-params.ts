export const ORDER_ACTOR = {
  CLIENT: 'client',
  COURIER: 'courier',
  STAFF: 'staff',
  SYSTEM: 'system',
} as const;

export type OrderActor = (typeof ORDER_ACTOR)[keyof typeof ORDER_ACTOR];

export const ORDER_OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export type OrderOfferStatus = (typeof ORDER_OFFER_STATUS)[keyof typeof ORDER_OFFER_STATUS];

export const TICKET_TOPIC = {
  ORDER_PROBLEM: 'order_problem',
  PAYMENT: 'payment',
  ACCOUNT: 'account',
  CLIENT_UNREACHABLE: 'client_unreachable',
  APP: 'app',
  OTHER: 'other',
} as const;

export type TicketTopic = (typeof TICKET_TOPIC)[keyof typeof TICKET_TOPIC];

export const TICKET_AUTHOR = {
  CLIENT: ORDER_ACTOR.CLIENT,
  COURIER: ORDER_ACTOR.COURIER,
} as const;
