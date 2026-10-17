// The color group of a status: it picks one of the `status-*` tokens.
export const STATUS_TONE = {
  NEW: 'new',
  ACTIVE: 'active',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type StatusTone = (typeof STATUS_TONE)[keyof typeof STATUS_TONE];

// Full class names, so that Tailwind finds them.
export const TONE_DOT_CLASS: Record<StatusTone, string> = {
  [STATUS_TONE.NEW]: 'bg-status-new',
  [STATUS_TONE.ACTIVE]: 'bg-status-active',
  [STATUS_TONE.DELIVERED]: 'bg-status-delivered',
  [STATUS_TONE.CANCELLED]: 'bg-status-cancelled',
};

export const TONE_RING_CLASS: Record<StatusTone, string> = {
  [STATUS_TONE.NEW]: 'border-2 border-status-new',
  [STATUS_TONE.ACTIVE]: 'border-2 border-status-active',
  [STATUS_TONE.DELIVERED]: 'border-2 border-status-delivered',
  [STATUS_TONE.CANCELLED]: 'border-2 border-status-cancelled',
};
