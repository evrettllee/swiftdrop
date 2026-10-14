import type { LOCATION_UPDATE_REJECTIONS } from '../constants/couriers-socket.constants';

// Kept on socket.data for the life of the connection.
export type CourierSocketData = {
  userId: number;
  courierProfileId: number;
  sessionExpiresAtMs: number;
  // When this socket last had a position accepted, null before the first one.
  lastLocationAtMs: number | null;
};

export type LocationUpdateRejection =
  (typeof LOCATION_UPDATE_REJECTIONS)[keyof typeof LOCATION_UPDATE_REJECTIONS];

// The acknowledgement of location:update.
export type LocationAck = { ok: true } | { ok: false; reason: LocationUpdateRejection };
