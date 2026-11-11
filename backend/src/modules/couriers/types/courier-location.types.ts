import type { LOCATION_UPDATE_REJECTIONS } from '../constants/courier-location.constants';

export type CourierLocationSession = {
  courierProfileId: number;
  sessionExpiresAtMs: number;
  // When this socket last had a position accepted, null before the first one.
  lastLocationAtMs: number | null;
};

export type LocationUpdateRejection =
  (typeof LOCATION_UPDATE_REJECTIONS)[keyof typeof LOCATION_UPDATE_REJECTIONS];

// The acknowledgement of location:update.
export type LocationAck = { ok: true } | { ok: false; reason: LocationUpdateRejection };

// The payload of courier:location; updatedAt is the time of the database that stored the position.
export type CourierLocationEvent = {
  orderId: number;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

// What a position sent on the socket ended with: the answer to the courier and, when it was
// stored during an active order, the event for the room of that order.
export type SavedCourierPosition = {
  courierProfileId: number;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export type LocationUpdateResult = {
  ack: LocationAck;
  event: CourierLocationEvent | null;
  saved: SavedCourierPosition | null;
};
