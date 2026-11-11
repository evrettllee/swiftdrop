import { z } from 'zod';
import { SOCKET_EVENTS } from './socket-events';

export const COURIER_EVENT_SCHEMAS = {
  [SOCKET_EVENTS.ORDER_ASSIGNED]: z.object({ orderId: z.number() }),
  [SOCKET_EVENTS.ORDER_UNASSIGNED]: z.object({ orderId: z.number() }),
  [SOCKET_EVENTS.OFFER_CLOSED]: z.object({ offerId: z.number() }),
};
