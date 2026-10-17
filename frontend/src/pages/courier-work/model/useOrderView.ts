import { useState } from 'react';

// What the screen of the current order shows: the order or the code of the recipient. It lives in
// the state of the screen, never in the URL. The closed order is shown by the work page itself.
export const ORDER_VIEW = {
  ORDER: 'order',
  CODE: 'code',
} as const;

type OrderView =
  // `error` comes from the code screen when the order has moved on without it; `isReturn` tells
  // that the courier comes back from the code screen, so the focus must go to the title.
  | { kind: typeof ORDER_VIEW.ORDER; error: string | null; isReturn: boolean }
  | { kind: typeof ORDER_VIEW.CODE };

const ORDER: OrderView = { kind: ORDER_VIEW.ORDER, error: null, isReturn: false };
const CODE: OrderView = { kind: ORDER_VIEW.CODE };

export function useOrderView() {
  const [view, setView] = useState<OrderView>(ORDER);

  return {
    view,
    openCode: () => setView(CODE),
    showOrder: (error: string | null = null) =>
      setView({ kind: ORDER_VIEW.ORDER, error, isReturn: true }),
  };
}
