import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONNECTION_STATUS,
  SOCKET_EVENTS,
  type TypedSocketEvent,
  useConnectionStatus,
  useSocketEventBatch,
} from '@/shared/realtime';
import { getManagerOrderCounts, getSupportCounts, orderCountsStore } from '@/shared/staff-api';
import type { NavCounts } from './navigation';

const ORDER_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.STAFF_ORDER];
const SUPPORT_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];

function useLatestLoad(load: (signal: AbortSignal) => Promise<void>): () => void {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    load(controller.signal).catch(() => undefined);
  }, [load]);
}

const loadOrderCounts = async (signal: AbortSignal) => {
  await getManagerOrderCounts(signal);
};

function useAttentionCount(): number {
  const counts = orderCountsStore.useStoredOrderCounts();

  useEffect(() => orderCountsStore.forgetOrderCounts, []);

  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const load = useLatestLoad(loadOrderCounts);

  useEffect(() => {
    if (
      isConnected &&
      !orderCountsStore.areOrderCountsFresh() &&
      !orderCountsStore.hasOrderCountsOwner()
    ) {
      load();
    }
  }, [isConnected, load]);

  useSocketEventBatch(ORDER_EVENTS, () => {
    if (!orderCountsStore.hasOrderCountsOwner()) {
      load();
    }
  });

  return counts?.attention ?? 0;
}

function useAwaitingCount(): number {
  const [count, setCount] = useState(0);
  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const loadAwaiting = useCallback(async (signal: AbortSignal) => {
    const counts = await getSupportCounts(signal);

    if (!signal.aborted) {
      setCount(counts.awaiting);
    }
  }, []);
  const load = useLatestLoad(loadAwaiting);

  useEffect(() => {
    if (isConnected) {
      load();
    }
  }, [isConnected, load]);

  useSocketEventBatch(SUPPORT_EVENTS, load);

  return count;
}

export function useNavCounts(): NavCounts {
  return { attention: useAttentionCount(), awaiting: useAwaitingCount() };
}
