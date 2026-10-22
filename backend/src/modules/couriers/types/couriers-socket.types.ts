import type { ROLE } from '../../../common/enums/role.enum';
import type {
  LOCATION_UPDATE_REJECTIONS,
  ORDER_JOIN_REJECTIONS,
  SOCKET_ROLES,
} from '../constants/couriers-socket.constants';

export type SocketRole = (typeof SOCKET_ROLES)[number];

// What every socket keeps, whoever opened it.
type SocketSessionState = {
  userId: number;
  sessionExpiresAtMs: number;
  // When this socket tried to join an order room within the last window, the oldest first.
  orderJoinAttemptsMs: number[];
};

// Kept on socket.data for the life of the connection; the role tells which of them it is.
export type CourierSocketData = SocketSessionState & {
  role: typeof ROLE.COURIER;
  courierProfileId: number;
  // When this socket last had a position accepted, null before the first one.
  lastLocationAtMs: number | null;
};

export type ClientSocketData = SocketSessionState & {
  role: typeof ROLE.CLIENT;
};

export type AppSocketData = CourierSocketData | ClientSocketData;

export type LocationUpdateRejection =
  (typeof LOCATION_UPDATE_REJECTIONS)[keyof typeof LOCATION_UPDATE_REJECTIONS];

// The acknowledgement of location:update.
export type LocationAck = { ok: true } | { ok: false; reason: LocationUpdateRejection };

export type OrderJoinRejection = (typeof ORDER_JOIN_REJECTIONS)[keyof typeof ORDER_JOIN_REJECTIONS];

// The acknowledgement of order:join.
export type OrderJoinAck = { ok: true } | { ok: false; reason: OrderJoinRejection };

export type EmitToOrderOptions = {
  // The sockets of this courier do not get the event, for example their own position.
  exceptCourierProfileId?: number;
};
