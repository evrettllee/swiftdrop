// The color group of a status: it picks one of the `status-*` tokens.
export const STATUS_TONE = {
  NEW: 'new',
  ACTIVE: 'active',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type StatusTone = (typeof STATUS_TONE)[keyof typeof STATUS_TONE];
