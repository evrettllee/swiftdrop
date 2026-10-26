import { z } from 'zod';
import { MS_PER_SECOND } from '@/shared/config';

// Why the backend did not save a position (the reason of the acknowledgement); must match it.
export const LOCATION_UPDATE_REJECTION = {
  // The socket is not a courier's: only couriers send positions.
  FORBIDDEN: 'forbidden',
  // The account was blocked after the socket opened: the backend closes the socket after this answer.
  UNAUTHORIZED: 'unauthorized',
  SESSION_EXPIRED: 'session_expired',
  TOO_FREQUENT: 'too_frequent',
  INVALID_LOCATION: 'invalid_location',
  OFF_SHIFT: 'off_shift',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable',
} as const;

export const locationAckSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), reason: z.enum(LOCATION_UPDATE_REJECTION) }),
]);

export type LocationAck = z.infer<typeof locationAckSchema>;

export type LocationUpdateRejection =
  (typeof LOCATION_UPDATE_REJECTION)[keyof typeof LOCATION_UPDATE_REJECTION];

// A position not acknowledged in this time counts as not sent: the next one goes as usual.
export const LOCATION_ACK_TIMEOUT_MS = 10 * MS_PER_SECOND;
