// The events of the app socket (the /couriers namespace of the backend); must match the backend.
export const SOCKET_EVENTS = {
  // A position of the courier, with an acknowledgement.
  LOCATION_UPDATE: 'location:update',
  // A new offer of an order (the CourierOffer of the backend).
  OFFER_NEW: 'offer:new',
  // The offer can no longer be accepted: { offerId }.
  OFFER_CLOSED: 'offer:closed',
  // The client cancelled the order the courier was heading to: { orderId }.
  ORDER_CANCELLED: 'order:cancelled',
  // The owner of an order or its courier asks for the events of the order (with an
  // acknowledgement), and stops: { orderId }.
  ORDER_JOIN: 'order:join',
  ORDER_LEAVE: 'order:leave',
  // The events of the room of an order (order-events.ts).
  COURIER_LOCATION: 'courier:location',
  ORDER_STATUS: 'order:status',
  ORDER_ETA: 'order:eta',
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
