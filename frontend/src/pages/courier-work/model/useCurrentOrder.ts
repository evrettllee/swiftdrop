import { useCallback, useEffect, useState } from 'react';
import { refreshCourierProfile } from '@/entities/courier';
import { type CourierOrder, type CurrentCourierOrder, getCurrentCourierOrder } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import {
  SOCKET_EVENTS,
  type TypedSocketEvent,
  useSocketEventBatch,
  useSocketReconnect,
} from '@/shared/realtime';

type CurrentOrderState = {
  status: ListStatus;
  // The last order that came, kept on screen while it loads again.
  order: CurrentCourierOrder | null;
};

const TICKET_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];

const LOADING: CurrentOrderState = { status: LIST_STATUS.LOADING, order: null };
const FAILED: CurrentOrderState = { status: LIST_STATUS.ERROR, order: null };

// The order the courier carries, loaded when the screen opens, when the order of the profile
// changes and when the socket connects back. No order means the profile is behind: it is loaded
// again, and the page goes back to the line. A failed load keeps the order the screen shows.
export function useCurrentOrder(activeOrderId: number) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<CurrentOrderState>(LOADING);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentCourierOrder(controller.signal).then(
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

  useSocketReconnect(reload);
  useSocketEventBatch(TICKET_EVENTS, reload);

  // The answer of a step is the order after it.
  const setOrder = useCallback(
    (order: CourierOrder) =>
      setState((current) => ({
        status: LIST_STATUS.READY,
        order: { ...order, supportTicket: current.order?.supportTicket ?? null },
      })),
    [],
  );

  return { ...state, reload, setOrder };
}
