import { z } from 'zod';
import { CHAT_SENDER_ROLE, chatMessageSchema, dateSchema, orderStatusSchema } from '@/shared/api';
import { onSocketEvent } from './app-socket';
import { SOCKET_EVENTS } from './socket-events';

// Where the line of the courier leads (the CourierLegTarget of the backend).
export const COURIER_LEG_TARGET = {
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
} as const;

// The line along the roads from the courier to the point they go to now (polyline6).
const courierLegSchema = z.object({
  geometry: z.string(),
  toPoint: z.enum(COURIER_LEG_TARGET),
});

export type CourierLeg = z.infer<typeof courierLegSchema>;

// The events of the room of an order, as the backend sends them. A courier never gets their own
// courier:location.
const ORDER_EVENT_SCHEMAS = {
  // updatedAt: when the backend stored the position, by its clock.
  [SOCKET_EVENTS.COURIER_LOCATION]: z.object({
    orderId: z.number(),
    latitude: z.number(),
    longitude: z.number(),
    updatedAt: dateSchema,
  }),
  // A new status, sent after it is committed.
  [SOCKET_EVENTS.ORDER_STATUS]: z.object({
    orderId: z.number(),
    status: orderStatusSchema,
    estimatedDeliveryAt: dateSchema.nullable(),
  }),
  // A new arrival estimate; pickupEtaAt only while the courier goes to the pickup point.
  [SOCKET_EVENTS.ORDER_ETA]: z.object({
    orderId: z.number(),
    estimatedDeliveryAt: dateSchema,
    courierLeg: courierLegSchema.nullable(),
    pickupEtaAt: dateSchema.nullable(),
  }),
  // Both sides and every tab of the sender get it: a message already kept is dropped by its id.
  [SOCKET_EVENTS.MESSAGE_NEW]: z.object({ orderId: z.number(), message: chatMessageSchema }),
  // The reader read every message to them up to this id.
  [SOCKET_EVENTS.MESSAGE_READ]: z.object({
    orderId: z.number(),
    readerRole: z.enum(CHAT_SENDER_ROLE),
    upToMessageId: z.number(),
  }),
};

type OrderEventSchemas = typeof ORDER_EVENT_SCHEMAS;

export type OrderEvent = keyof OrderEventSchemas;

export type OrderEventPayload<E extends OrderEvent> = z.infer<OrderEventSchemas[E]>;

// Calls `handler` with every valid `event` of the order rooms the socket is in, until the returned
// function is called. An event the schema does not accept is dropped: the page keeps what it has,
// and the developer sees why in the console.
export function onOrderEvent<E extends OrderEvent>(
  event: E,
  handler: (payload: OrderEventPayload<E>) => void,
): () => void {
  const schema = ORDER_EVENT_SCHEMAS[event];

  return onSocketEvent(event, (payload) => {
    const parsed = schema.safeParse(payload);

    if (parsed.success) {
      handler(parsed.data as OrderEventPayload<E>);
    } else if (import.meta.env.DEV) {
      console.warn(`Socket event ${event} dropped: ${parsed.error.message}`);
    }
  });
}
