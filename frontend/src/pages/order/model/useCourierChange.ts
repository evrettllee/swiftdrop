import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { OrderTracking } from '@/entities/order';
import type { ClientOrderCourier } from '@/shared/api';
import {
  type EventSubscription,
  onOrderEvent,
  type OrderEvent,
  SOCKET_EVENTS,
  subscribeBatched,
} from '@/shared/realtime';
import { showToast } from '@/shared/ui/toast';
import { ORDER_COURIER_TEXTS } from '../config/tracking';

const ORDER_CHANGE_EVENTS: readonly OrderEvent[] = [
  SOCKET_EVENTS.ORDER_STATUS,
  SOCKET_EVENTS.ORDER_COURIER,
];

function orderSubscription(orderId: number, event: OrderEvent): EventSubscription {
  return (listener) =>
    onOrderEvent(event, (payload) => {
      if (payload.orderId === orderId) {
        listener();
      }
    });
}

const COURIER_CHANGE_TOAST_KEY = 'order-courier';

type CourierChangeSource = {
  orderId: number;
  tracking: OrderTracking;
  courier: ClientOrderCourier['courier'];
  reload: () => void;
};

type PendingChange = { isReplaced: boolean };

type ChangingState = { courier: ClientOrderCourier['courier'] } | null;

export function useCourierChange({ orderId, tracking, courier, reload }: CourierChangeSource) {
  const [changes, setChanges] = useState(0);
  const [changing, setChanging] = useState<ChangingState>(null);
  const pending = useRef<PendingChange | null>(null);
  const knownCourierId = useRef<number | null>(null);
  const startChange = useEffectEvent((courierId: number | null) => {
    const isReplaced =
      courierId !== null && courier !== null && courierId !== knownCourierId.current;
    knownCourierId.current = courierId;
    tracking.applyCourierChange();
    pending.current = { isReplaced: isReplaced || pending.current?.isReplaced === true };
    setChanging({ courier });
  });

  useEffect(
    () =>
      onOrderEvent(SOCKET_EVENTS.ORDER_COURIER, (event) => {
        if (event.orderId === orderId) {
          startChange(event.courierId);
        }
      }),
    [orderId],
  );

  const finishChange = useEffectEvent(() => {
    const change = pending.current;
    pending.current = null;
    reload();

    if (change === null) {
      return;
    }

    setChanges((count) => count + 1);

    if (change.isReplaced) {
      showToast({
        key: COURIER_CHANGE_TOAST_KEY,
        variant: 'info',
        title: ORDER_COURIER_TEXTS.CHANGED,
        text: '',
      });
    }
  });

  useEffect(
    () =>
      subscribeBatched(
        ORDER_CHANGE_EVENTS.map((event) => orderSubscription(orderId, event)),
        () => finishChange(),
      ),
    [orderId],
  );

  return { changes, isChanging: changing !== null && changing.courier === courier };
}
