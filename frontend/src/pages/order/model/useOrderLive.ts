import { useEffect, useEffectEvent } from 'react';
import { useOrderChat } from '@/features/order-chat';
import { CHAT_SENDER_ROLE, type ClientOrderCourier, type OrderDetails } from '@/shared/api';
import {
  SOCKET_EVENTS,
  type TypedSocketEvent,
  useOrderRoom,
  useSocketEventBatch,
} from '@/shared/realtime';
import { isValidOrderId } from '../lib/order-answer';
import { COURIER_VISIBLE_STATUSES } from './order-status-groups';
import { useCourierChange } from './useCourierChange';
import { useOrderTracking } from './useOrderTracking';

const TICKET_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];

type OrderLiveSource = {
  order: OrderDetails | null;
  courier: ClientOrderCourier['courier'];
  // Asks for the order again quietly: a failure keeps what is shown.
  refresh: () => void;
  // Asks for the courier and the code again.
  refreshCourier: () => void;
};

// The order as it changes while the page is open: the page is in the room of the order, and its
// events reach the tracking and the chat. A new status loads the order and its courier again (the
// event does not carry the history or the code). After a lost connection the events sent meanwhile
// are gone, so after every join of the room (the first one too) the order, its route and the
// newest page of the chat are loaded again; the courier follows a new status of the order. The chat
// exists from the assignment on.
export function useOrderLive(
  orderId: number,
  { order, courier, refresh, refreshCourier }: OrderLiveSource,
) {
  const joins = useOrderRoom(isValidOrderId(orderId) ? orderId : null);
  const reloadAfterJoin = useEffectEvent(refresh);
  const tracking = useOrderTracking(orderId);
  const courierChange = useCourierChange({
    orderId,
    tracking,
    courier,
    reload: () => {
      refresh();
      refreshCourier();
    },
  });
  const status = order?.status ?? null;
  const hasChat = status !== null && COURIER_VISIBLE_STATUSES.includes(status);
  const chat = useOrderChat(
    hasChat ? orderId : null,
    CHAT_SENDER_ROLE.CLIENT,
    joins + courierChange.changes,
  );

  useEffect(() => {
    if (order !== null) {
      tracking.applyStatus(order.status, order.estimatedDeliveryAt);
    }
  }, [order, tracking]);

  useEffect(() => {
    if (joins > 0) {
      reloadAfterJoin();
    }
  }, [joins]);

  useSocketEventBatch(TICKET_EVENTS, refresh);

  return {
    tracking,
    routeReloadToken: joins + courierChange.changes,
    chat,
    isCourierChanging: courierChange.isChanging,
  };
}

export type OrderLive = ReturnType<typeof useOrderLive>;
