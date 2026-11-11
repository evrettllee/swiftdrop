import { useEffect, useState } from 'react';
import type { GeoPoint } from '@/shared/lib/geo';
import { type MapRoute, useRouteLines } from '@/shared/lib/route-lines';
import { getManagerOrder, getManagerOrderRoute } from '@/shared/staff-api';

type OrderFacts = {
  orderId: number;
  estimatedDeliveryAt: Date | null;
  pickup: GeoPoint;
  delivery: GeoPoint;
};

export type SelectedOrder = {
  estimatedDeliveryAt: Date | null;
  pickup: GeoPoint;
  delivery: GeoPoint;
  route: MapRoute;
};

export function useSelectedOrder(
  orderId: number | null,
  courierPoint: GeoPoint | null,
): SelectedOrder | null {
  const [facts, setFacts] = useState<OrderFacts | null>(null);
  const route = useRouteLines(
    orderId === null ? null : (options) => getManagerOrderRoute(orderId, options),
    String(orderId ?? ''),
    { movingPoint: courierPoint },
  );

  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getManagerOrder(orderId, { signal: controller.signal }).then(
      (order) =>
        setFacts({
          orderId,
          estimatedDeliveryAt: order.estimatedDeliveryAt,
          pickup: order.route.from,
          delivery: order.route.to,
        }),
      () => undefined,
    );

    return () => controller.abort();
  }, [orderId]);

  if (facts === null || facts.orderId !== orderId) {
    return null;
  }

  const { estimatedDeliveryAt, pickup, delivery } = facts;

  return { estimatedDeliveryAt, pickup, delivery, route };
}
