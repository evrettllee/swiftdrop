import { useEffect, useEffectEvent } from 'react';
import { type EventSubscription, subscribeBatched } from './event-batch';
import { onTypedSocketEvent, type TypedSocketEvent } from './typed-events';

function toSubscription(event: TypedSocketEvent): EventSubscription {
  return (listener) => onTypedSocketEvent(event, () => listener());
}

export function useSocketEventBatch(
  events: readonly TypedSocketEvent[],
  onBatch: () => void,
): void {
  const handleBatch = useEffectEvent(onBatch);

  useEffect(
    () =>
      subscribeBatched(events.map(toSubscription), () => {
        handleBatch();
      }),
    [events],
  );
}
