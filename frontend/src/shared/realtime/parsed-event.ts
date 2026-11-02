import type { z } from 'zod';
import { onSocketEvent } from './app-socket';
import type { SocketEvent } from './socket-events';

export function onParsedSocketEvent<P>(
  event: SocketEvent,
  schema: z.ZodType,
  handler: (payload: P) => void,
): () => void {
  return onSocketEvent(event, (payload) => {
    const parsed = schema.safeParse(payload);

    if (parsed.success) {
      handler(parsed.data as P);
    } else if (import.meta.env.DEV) {
      console.warn(`Socket event ${event} dropped: ${parsed.error.message}`);
    }
  });
}
