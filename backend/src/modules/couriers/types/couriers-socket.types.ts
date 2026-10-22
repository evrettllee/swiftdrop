import type { ROLE } from '../../../common/enums/role.enum';
import type {
  LOCATION_UPDATE_REJECTIONS,
  SOCKET_ROLES,
} from '../constants/couriers-socket.constants';

export type SocketRole = (typeof SOCKET_ROLES)[number];

// Kept on socket.data for the life of the connection; the role tells which of them it is.
export type CourierSocketData = {
  role: typeof ROLE.COURIER;
  userId: number;
  courierProfileId: number;
  sessionExpiresAtMs: number;
  // When this socket last had a position accepted, null before the first one.
  lastLocationAtMs: number | null;
};

export type ClientSocketData = {
  role: typeof ROLE.CLIENT;
  userId: number;
  sessionExpiresAtMs: number;
};

export type AppSocketData = CourierSocketData | ClientSocketData;

export type LocationUpdateRejection =
  (typeof LOCATION_UPDATE_REJECTIONS)[keyof typeof LOCATION_UPDATE_REJECTIONS];

// The acknowledgement of location:update.
export type LocationAck = { ok: true } | { ok: false; reason: LocationUpdateRejection };
