export const SOCKET_EVENTS = {
  LOCATION_UPDATE: 'location:update',
  OFFER_NEW: 'offer:new',
  // The offer can no longer be accepted: its time is up, the order or the courier left.
  OFFER_CLOSED: 'offer:closed',
  // The client cancelled the order the courier was heading to.
  ORDER_CANCELLED: 'order:cancelled',
  // The owner of an order or its courier asks for the events of the order, and stops.
  ORDER_JOIN: 'order:join',
  ORDER_LEAVE: 'order:leave',
  // The position of the courier, sent to the room of their active order.
  COURIER_LOCATION: 'courier:location',
  // The order got a new status; sent after the change is committed.
  ORDER_STATUS: 'order:status',
  // A new arrival estimate and the line of the courier to their next point.
  ORDER_ETA: 'order:eta',
  // A new message of the order chat, sent after it is committed.
  MESSAGE_NEW: 'message:new',
  // One side read the messages to it up to an id; sent only when something was marked.
  MESSAGE_READ: 'message:read',
  STAFF_ORDER: 'staff:order',
  ORDER_ASSIGNED: 'order:assigned',
} as const;

export const STAFF_ORDER_EVENT_KIND = {
  CREATED: 'created',
  STATUS: 'status',
  COURIER: 'courier',
} as const;

export const STAFF_ORDER_EVENT_KIND_VALUES = [
  STAFF_ORDER_EVENT_KIND.CREATED,
  STAFF_ORDER_EVENT_KIND.STATUS,
  STAFF_ORDER_EVENT_KIND.COURIER,
] as const;
