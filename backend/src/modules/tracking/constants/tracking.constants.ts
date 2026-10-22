// Events of the order room, for the client who owns the order and its courier.
export const ORDER_ROOM_EVENTS = {
  // The order got a new status; sent after the change is committed.
  ORDER_STATUS: 'order:status',
} as const;
