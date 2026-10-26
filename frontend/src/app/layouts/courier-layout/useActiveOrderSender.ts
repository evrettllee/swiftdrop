import { useEffect, useState } from 'react';
import { getCurrentCourierOrder } from '@/shared/api';

type KnownSender = { orderId: number; name: string };

export function useActiveOrderSender(activeOrderId: number | null): string | null {
  const [sender, setSender] = useState<KnownSender | null>(null);

  useEffect(() => {
    if (activeOrderId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getCurrentCourierOrder(controller.signal).then(
      (order) => {
        if (order !== null && order.orderId === activeOrderId) {
          setSender({ orderId: order.orderId, name: order.sender.name });
        }
      },
      () => undefined,
    );

    return () => controller.abort();
  }, [activeOrderId]);

  return sender !== null && sender.orderId === activeOrderId ? sender.name : null;
}
