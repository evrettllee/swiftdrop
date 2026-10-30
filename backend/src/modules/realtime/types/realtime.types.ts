import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { SupportTicketStatus } from '@/common/enums/support-ticket.enum';
import type { ROLE } from '@/common/enums/role.enum';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import type { CourierLocationSession } from '@/modules/couriers/types/courier-location.types';
import type {
  ORDER_JOIN_REJECTIONS,
  PARTICIPANT_ACCESS,
  SOCKET_ROLES,
  STAFF_ROLES,
} from '../constants/realtime.constants';
import type {
  STAFF_COURIER_EVENT_KIND_VALUES,
  STAFF_ORDER_EVENT_KIND_VALUES,
  SUPPORT_READ_BY_VALUES,
  SUPPORT_TICKET_EVENT_KIND_VALUES,
} from '../constants/socket-events.constants';

// Who opened a socket and until when their access token was valid at that moment.
export type SocketSession = {
  user: AuthUser;
  expiresAtMs: number;
};

export type SocketRole = (typeof SOCKET_ROLES)[number];

export type StaffRole = (typeof STAFF_ROLES)[number];

// What every socket keeps, whoever opened it.
type SocketSessionState = {
  userId: number;
  sessionExpiresAtMs: number;
  // When this socket tried to join an order room within the last window, the oldest first.
  orderJoinAttemptsMs: number[];
};

// Kept on socket.data for the life of the connection; the role tells which of them it is.
export type CourierSocketData = SocketSessionState &
  CourierLocationSession & {
    role: typeof ROLE.COURIER;
  };

export type ClientSocketData = SocketSessionState & {
  role: typeof ROLE.CLIENT;
};

export type StaffSocketData = SocketSessionState & {
  role: StaffRole;
};

export type ParticipantSocketData = CourierSocketData | ClientSocketData;

export type AppSocketData = ParticipantSocketData | StaffSocketData;

export type OrderJoinRejection = (typeof ORDER_JOIN_REJECTIONS)[keyof typeof ORDER_JOIN_REJECTIONS];

export type ParticipantAccess = (typeof PARTICIPANT_ACCESS)[keyof typeof PARTICIPANT_ACCESS];

// The acknowledgement of order:join.
export type OrderJoinAck = { ok: true } | { ok: false; reason: OrderJoinRejection };

export type EmitToOrderOptions = {
  // The sockets of this courier do not get the event, for example their own position.
  exceptCourierProfileId?: number;
};

export type StaffOrderEventKind = (typeof STAFF_ORDER_EVENT_KIND_VALUES)[number];

export type StaffOrderEvent = {
  orderId: number;
  kind: StaffOrderEventKind;
  status: OrderStatus;
  statusChangedAt: string;
  courierId: number | null;
};

export type OrderAssignedEvent = {
  orderId: number;
};

export type OrderUnassignedEvent = {
  orderId: number;
};

export type OrderCourierEvent = {
  orderId: number;
  courierId: number | null;
};

export type StaffCourierLocationEvent = {
  courierId: number;
  lat: number;
  lng: number;
  at: string;
};

export type StaffCourierEventKind = (typeof STAFF_COURIER_EVENT_KIND_VALUES)[number];

export type StaffCourierEvent = {
  courierId: number;
  kind: StaffCourierEventKind;
};

export type StaffZoneEvent = {
  zoneId: number;
};

export type EmitToTicketOptions = {
  exceptStaff?: boolean;
  exceptUserId?: number;
};

export type SupportMessagePayload = {
  id: number;
  text: string;
  createdAt: string;
  fromStaff: boolean;
  authorName: string;
  isRead: boolean;
};

export type SupportMessageEvent = {
  ticketId: number;
  message: SupportMessagePayload;
};

export type SupportReadBy = (typeof SUPPORT_READ_BY_VALUES)[number];

export type SupportReadEvent = {
  ticketId: number;
  by: SupportReadBy;
};

export type SupportTicketEventKind = (typeof SUPPORT_TICKET_EVENT_KIND_VALUES)[number];

export type SupportTicketEvent = {
  ticketId: number;
  kind: SupportTicketEventKind;
  awaitingStaff: boolean;
  status: SupportTicketStatus;
};
