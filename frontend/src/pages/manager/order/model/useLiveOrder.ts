import { useEffect, useEffectEvent, useRef } from 'react';
import {
  CONNECTION_STATUS,
  onTypedSocketEvent,
  SOCKET_EVENTS,
  type TypedSocketEvent,
  useConnectionStatus,
  useSocketEventBatch,
} from '@/shared/realtime';

const ORDER_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.STAFF_ORDER];

export function useLiveOrder(orderId: number | null, refresh: () => void): void {
  const isChanged = useRef(false);
  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const wasConnected = useRef(isConnected);
  const isLost = useRef(false);
  const reconnected = useEffectEvent(refresh);

  useEffect(
    () =>
      onTypedSocketEvent(SOCKET_EVENTS.STAFF_ORDER, (payload) => {
        if (payload.orderId === orderId) {
          isChanged.current = true;
        }
      }),
    [orderId],
  );

  useSocketEventBatch(ORDER_EVENTS, () => {
    if (isChanged.current) {
      isChanged.current = false;
      refresh();
    }
  });

  useEffect(() => {
    if (!isConnected && wasConnected.current) {
      isLost.current = true;
    }

    if (isConnected && isLost.current) {
      isLost.current = false;
      reconnected();
    }

    wasConnected.current = isConnected;
  }, [isConnected]);
}
