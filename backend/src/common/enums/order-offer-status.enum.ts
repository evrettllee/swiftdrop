export const ORDER_OFFER_STATUS_VALUES = ['pending', 'accepted', 'declined', 'expired'] as const;

export type OrderOfferStatus = (typeof ORDER_OFFER_STATUS_VALUES)[number];

export const ORDER_OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const satisfies Record<string, OrderOfferStatus>;
