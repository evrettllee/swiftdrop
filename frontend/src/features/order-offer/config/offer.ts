import { MS_PER_SECOND } from '@/shared/config';

// The time to answer an offer (OFFER_TTL_MS of the backend): the timer never shows more, whatever
// the clock of the device says.
export const OFFER_TTL_MS = 30 * MS_PER_SECOND;
// The last seconds of an offer are shown in the warning color.
export const OFFER_URGENT_MS = 10 * MS_PER_SECOND;
// How often the timer looks at the clock: often enough to change the second in time.
export const OFFER_TICK_MS = 250;
// How long the message about a closed offer stays.
export const OFFER_NOTICE_MS = 3 * MS_PER_SECOND;
// A short series on a phone when an offer comes: on, off, on, in milliseconds.
export const OFFER_VIBRATION_PATTERN = [200, 100, 200];

// The backend rounds the delivery point to two digits after the point of a degree, so the real
// point is within about 700 m of it in Minsk (0.005° of latitude and of longitude together).
export const DELIVERY_AREA_RADIUS_M = 700;

// "2,1 км" to the pickup point.
export const PICKUP_DISTANCE_FRACTION_DIGITS = 1;

export const OFFER_NOTICE = {
  // The time to answer is up.
  EXPIRED: 'expired',
  // The offer was closed before the courier took it: cancelled or given to someone else.
  TAKEN: 'taken',
} as const;

export type OfferNotice = (typeof OFFER_NOTICE)[keyof typeof OFFER_NOTICE];

export const OFFER_RESPONSE = {
  ACCEPT: 'accept',
  DECLINE: 'decline',
} as const;

export type OfferResponse = (typeof OFFER_RESPONSE)[keyof typeof OFFER_RESPONSE];
