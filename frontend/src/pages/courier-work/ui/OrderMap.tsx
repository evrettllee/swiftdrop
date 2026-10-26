import { lazy, Suspense } from 'react';
import { useCourierPosition } from '@/entities/courier';
import { type CourierOrder, getCourierOrderRoute } from '@/shared/api';
import { MAP_FRAME_CLASS } from '@/shared/config';
import { useRouteLines } from '@/shared/lib/route-lines';
import { Skeleton } from '@/shared/ui/skeleton';

// Leaflet comes with the first order, not with the cabinet.
const CourierRouteMap = lazy(() =>
  import('@/shared/ui/route-map').then((module) => ({ default: module.CourierRouteMap })),
);

type OrderMapProps = {
  order: CourierOrder;
};

// The route of the order from where the courier is: a new stage or a move of the courier asks
// for it again.
export function OrderMap({ order }: OrderMapProps) {
  const position = useCourierPosition();
  const routeLines = useRouteLines(getCourierOrderRoute, `${order.orderId}:${order.status}`, {
    movingPoint: position,
  });

  return (
    <Suspense fallback={<Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />}>
      <CourierRouteMap
        pickup={order.pickup}
        delivery={order.delivery}
        route={routeLines}
        courierPoint={position}
        className={MAP_FRAME_CLASS}
      />
    </Suspense>
  );
}
