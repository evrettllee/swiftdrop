import { useCallback, useEffect, useRef, useState } from 'react';
import { refreshCourierProfile } from '@/entities/courier';
import type { CourierOrder } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { CONNECTION_STATUS, useConnectionStatus } from '@/shared/realtime';
import { getCurrentOrder } from '../api/courier-order';

export type CurrentOrderState = {
  status: ListStatus;
  // The last order that came, kept on screen while it loads again.
  order: CourierOrder | null;
};

const LOADING: CurrentOrderState = { status: LIST_STATUS.LOADING, order: null };
const FAILED: CurrentOrderState = { status: LIST_STATUS.ERROR, order: null };

// Asks for the order again each time the socket connects back: the order may have been cancelled
// while there was no connection. The first connection is not a return, the page loads it anyway.
// Not while `isPaused`.
function useReconnectReload(reload: () => void, isPaused: boolean): void {
  const connection = useConnectionStatus();
  const previous = useRef(connection);
  const hasBeenConnected = useRef(false);

  useEffect(() => {
    const isConnected = connection === CONNECTION_STATUS.CONNECTED;
    const isReturn =
      isConnected && previous.current !== CONNECTION_STATUS.CONNECTED && hasBeenConnected.current;
    previous.current = connection;

    if (isReturn && !isPaused) {
      reload();
    }

    if (isConnected) {
      hasBeenConnected.current = true;
    }
  }, [connection, reload, isPaused]);
}

// The order the courier carries, loaded when the screen opens, when the order of the profile
// changes and when the socket connects back. No order means the profile is behind: it is loaded
// again, and the page goes back to the line. A failed load keeps the order the screen shows.
// `isReconnectReloadPaused` keeps the screen of the closed order: a load would find no order and
// take the courier to the line before they press «К работе».
export function useCurrentOrder(activeOrderId: number, isReconnectReloadPaused: boolean) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<CurrentOrderState>(LOADING);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentOrder(controller.signal).then(
      async (order) => {
        if (order !== null) {
          setState({ status: LIST_STATUS.READY, order });
          return;
        }

        await refreshCourierProfile();

        // Still here: the profile did not come, so the courier can only try again.
        if (!controller.signal.aborted) {
          setState(FAILED);
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setState((current) => (current.order === null ? FAILED : current));
        }
      },
    );

    return () => controller.abort();
  }, [activeOrderId, version]);

  useReconnectReload(reload, isReconnectReloadPaused);

  // The answer of a step is the order after it.
  const setOrder = useCallback(
    (order: CourierOrder) => setState({ status: LIST_STATUS.READY, order }),
    [],
  );

  return { ...state, reload, setOrder };
}
