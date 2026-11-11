import type { z } from 'zod';
import { COURIER_EVENT_SCHEMAS } from './courier-events';
import { ORDER_EVENT_SCHEMAS } from './order-events';
import { onParsedSocketEvent } from './parsed-event';
import { STAFF_EVENT_SCHEMAS } from './staff-events';
import { SUPPORT_EVENT_SCHEMAS } from './support-events';

const TYPED_EVENT_SCHEMAS = {
  ...ORDER_EVENT_SCHEMAS,
  ...COURIER_EVENT_SCHEMAS,
  ...STAFF_EVENT_SCHEMAS,
  ...SUPPORT_EVENT_SCHEMAS,
};

type TypedEventSchemas = typeof TYPED_EVENT_SCHEMAS;

export type TypedSocketEvent = keyof TypedEventSchemas;

export type TypedSocketEventPayload<E extends TypedSocketEvent> = z.infer<TypedEventSchemas[E]>;

export function onTypedSocketEvent<E extends TypedSocketEvent>(
  event: E,
  handler: (payload: TypedSocketEventPayload<E>) => void,
): () => void {
  return onParsedSocketEvent<TypedSocketEventPayload<E>>(
    event,
    TYPED_EVENT_SCHEMAS[event],
    handler,
  );
}
