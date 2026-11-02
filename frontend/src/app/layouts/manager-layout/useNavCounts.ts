import { useCallback, useEffect, useRef, useState } from 'react';
import { getManagerOrderCounts, getSupportCounts } from '@/shared/api';
import {
  CONNECTION_STATUS,
  SOCKET_EVENTS,
  type TypedSocketEvent,
  useConnectionStatus,
  useSocketEventBatch,
} from '@/shared/realtime';
import type { NavCounts } from './navigation';

type CountLoader = (signal: AbortSignal) => Promise<number>;

const ORDER_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.STAFF_ORDER];
const SUPPORT_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];

const loadAttention: CountLoader = async (signal) =>
  (await getManagerOrderCounts(signal)).attention;

const loadAwaiting: CountLoader = async (signal) => (await getSupportCounts(signal)).awaiting;

function useLiveCount(load: CountLoader, events: readonly TypedSocketEvent[]): number {
  const [count, setCount] = useState(0);
  const isConnected = useConnectionStatus() === CONNECTION_STATUS.CONNECTED;
  const controllerRef = useRef<AbortController | null>(null);

  const reload = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    load(controller.signal).then(
      (loaded) => {
        if (!controller.signal.aborted) {
          setCount(loaded);
        }
      },
      () => undefined,
    );
  }, [load]);

  useEffect(() => {
    if (isConnected) {
      reload();
    }
  }, [isConnected, reload]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useSocketEventBatch(events, reload);

  return count;
}

export function useNavCounts(): NavCounts {
  const attention = useLiveCount(loadAttention, ORDER_EVENTS);
  const awaiting = useLiveCount(loadAwaiting, SUPPORT_EVENTS);

  return { attention, awaiting };
}
