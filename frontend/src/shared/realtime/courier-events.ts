// The events of the courier gateway; must match the backend.
export const COURIER_SOCKET_EVENTS = {
  LOCATION_UPDATE: 'location:update',
  // A new offer of an order (the CourierOffer of the backend).
  OFFER_NEW: 'offer:new',
  // The offer can no longer be accepted: { offerId }.
  OFFER_CLOSED: 'offer:closed',
  // The client cancelled the order the courier was heading to: { orderId }.
  ORDER_CANCELLED: 'order:cancelled',
} as const;

export type CourierSocketEvent = (typeof COURIER_SOCKET_EVENTS)[keyof typeof COURIER_SOCKET_EVENTS];
