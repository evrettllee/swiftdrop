export const ORDER_OFFER_STATUS_VALUES = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked',
] as const;

export type OrderOfferStatus = (typeof ORDER_OFFER_STATUS_VALUES)[number];

export const ORDER_OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const satisfies Record<string, OrderOfferStatus>;
