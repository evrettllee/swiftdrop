import { useEffect, useEffectEvent } from 'react';
import { useOrderChat } from '@/features/order-chat';
import { CHAT_SENDER_ROLE, type OrderDetails } from '@/shared/api';
import { useOrderRoom } from '@/shared/realtime';
import { isValidOrderId } from '../lib/order-answer';
import { COURIER_VISIBLE_STATUSES } from './order-status-groups';
import { useOrderTracking } from './useOrderTracking';

type OrderLiveSource = {
  order: OrderDetails | null;
  // Asks for the order again quietly: a failure keeps what is shown.
  refresh: () => void;
  // Asks for the courier and the code again.
  refreshCourier: () => void;
};

// The order as it changes while the page is open: the page is in the room of the order, and its
// events reach the tracking and the chat. A new status loads the order and its courier again (the
// event does not carry the history or the code). After a lost connection the events sent meanwhile
// are gone, so the room is joined again and the order, its courier, its route (`reloadToken`) and
// the newest page of the chat are loaded again. The chat exists from the assignment of a courier on.
export function useOrderLive(orderId: number, { order, refresh, refreshCourier }: OrderLiveSource) {
  const rejoins = useOrderRoom(isValidOrderId(orderId) ? orderId : null);
  const reloadAfterRejoin = useEffectEvent(() => {
    refresh();
    refreshCourier();
  });
  const { tracking, state } = useOrderTracking(orderId, () => {
    refresh();
    refreshCourier();
  });
  const status = order?.status ?? null;
  const hasChat = status !== null && COURIER_VISIBLE_STATUSES.includes(status);
  const chat = useOrderChat(hasChat ? orderId : null, CHAT_SENDER_ROLE.CLIENT, rejoins);

  useEffect(() => {
    if (order !== null) {
      tracking.applyStatus(order.status, order.estimatedDeliveryAt);
    }
  }, [order, tracking]);

  useEffect(() => {
    if (rejoins > 0) {
      reloadAfterRejoin();
    }
  }, [rejoins]);

  return { tracking, trackingState: state, routeReloadToken: rejoins, chat };
}

export type OrderLive = ReturnType<typeof useOrderLive>;
