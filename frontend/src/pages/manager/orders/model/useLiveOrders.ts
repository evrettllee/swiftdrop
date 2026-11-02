import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import {
  onTypedSocketEvent,
  SOCKET_EVENTS,
  STAFF_ORDER_EVENT_KIND,
  type TypedSocketEvent,
  useSocketEventBatch,
} from '@/shared/realtime';
import type { OrdersTab } from '../config/list';
import { isInTab } from './orders-view';

const ORDER_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.STAFF_ORDER];

type LiveOrdersOptions = {
  tab: OrdersTab;
  listKey: string;
  isAuto: boolean;
  onListChange: () => void;
  onCountsChange: () => void;
};

type NewOrders = {
  listKey: string;
  count: number;
};

export function useLiveOrders({
  tab,
  listKey,
  isAuto,
  onListChange,
  onCountsChange,
}: LiveOrdersOptions) {
  const [newOrders, setNewOrders] = useState<NewOrders>({ listKey, count: 0 });
  const countNew = useEffectEvent((status: Parameters<typeof isInTab>[1]) => {
    if (!isAuto && isInTab(tab, status)) {
      setNewOrders((previous) => ({
        listKey,
        count: previous.listKey === listKey ? previous.count + 1 : 1,
      }));
    }
  });

  useEffect(
    () =>
      onTypedSocketEvent(SOCKET_EVENTS.STAFF_ORDER, (payload) => {
        if (payload.kind === STAFF_ORDER_EVENT_KIND.CREATED) {
          countNew(payload.status);
        }
      }),
    [],
  );

  useSocketEventBatch(ORDER_EVENTS, () => {
    onCountsChange();

    if (isAuto) {
      onListChange();
    }
  });

  const clearNew = useCallback(() => setNewOrders({ listKey, count: 0 }), [listKey]);

  return {
    newCount: !isAuto && newOrders.listKey === listKey ? newOrders.count : 0,
    clearNew,
  };
}
