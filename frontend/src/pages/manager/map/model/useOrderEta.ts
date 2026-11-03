import { useEffect, useState } from 'react';
import { getManagerOrder } from '@/shared/staff-api';

type EtaAnswer = { orderId: number; estimatedDeliveryAt: Date | null };

export function useOrderEta(orderId: number | null): Date | null {
  const [answer, setAnswer] = useState<EtaAnswer | null>(null);

  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getManagerOrder(orderId, { signal: controller.signal }).then(
      (order) => setAnswer({ orderId, estimatedDeliveryAt: order.estimatedDeliveryAt }),
      () => undefined,
    );

    return () => controller.abort();
  }, [orderId]);

  return answer !== null && answer.orderId === orderId ? answer.estimatedDeliveryAt : null;
}
