import { type Clock, PAGE_CLOCK } from '@/shared/lib/clock';

export const SOCKET_EVENT_BATCH_DELAY_MS = 400;

export type EventSubscription = (listener: () => void) => () => void;

export function subscribeBatched(
  subscriptions: readonly EventSubscription[],
  action: () => void,
  clock: Clock = PAGE_CLOCK,
  delayMs: number = SOCKET_EVENT_BATCH_DELAY_MS,
): () => void {
  let timer: number | null = null;

  const cancel = () => {
    if (timer !== null) {
      clock.clearTimeout(timer);
      timer = null;
    }
  };

  const listener = () => {
    cancel();
    timer = clock.setTimeout(() => {
      timer = null;
      action();
    }, delayMs);
  };

  const unsubscribers = subscriptions.map((subscribe) => subscribe(listener));

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    cancel();
  };
}
