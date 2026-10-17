import { useState } from 'react';

// What the screen of the current order shows: the order, the code of the recipient, the order
// closed. It lives in the state of the screen, never in the URL.
export const ORDER_VIEW = {
  ORDER: 'order',
  CODE: 'code',
  DELIVERED: 'delivered',
} as const;

export type OrderView =
  // `error` comes from the code screen when the order has moved on without it.
  | { kind: typeof ORDER_VIEW.ORDER; error: string | null }
  | { kind: typeof ORDER_VIEW.CODE }
  | { kind: typeof ORDER_VIEW.DELIVERED; orderId: number; closedAt: Date };

const ORDER: OrderView = { kind: ORDER_VIEW.ORDER, error: null };
const CODE: OrderView = { kind: ORDER_VIEW.CODE };

export function useOrderView() {
  const [view, setView] = useState<OrderView>(ORDER);

  return {
    view,
    openCode: () => setView(CODE),
    showOrder: (error: string | null = null) => setView({ kind: ORDER_VIEW.ORDER, error }),
    showDelivered: (orderId: number, closedAt: Date) =>
      setView({ kind: ORDER_VIEW.DELIVERED, orderId, closedAt }),
  };
}
