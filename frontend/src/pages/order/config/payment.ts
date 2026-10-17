import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

// What the payment block says about the money of the order.
export const PAYMENT_VIEW = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  REFUNDED: 'refunded',
} as const;

// The icons of the payment block: the status row and the buttons.
export const PAYMENT_ICON_PROPS = {
  size: ICON_SIZE.MEDIUM,
  weight: ICON_WEIGHT,
  'aria-hidden': true,
} as const;
