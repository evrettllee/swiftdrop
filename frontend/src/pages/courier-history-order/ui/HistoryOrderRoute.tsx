import { lazy, Suspense } from 'react';
import { OrderRoutePoints } from '@/entities/order';
import { type CourierHistoryOrder, getCourierHistoryOrderRoute } from '@/shared/api';
import { useRouteLines } from '@/shared/lib/route-lines';
import { Section } from '@/shared/ui/section';
import { Skeleton } from '@/shared/ui/skeleton';
import { MAP_FRAME_CLASS } from '../config/map';
import { HISTORY_ORDER_TEXTS } from '../config/texts';

// Leaflet comes with the first map of the cabinet, not with the page.
const CourierRouteMap = lazy(() =>
  import('@/shared/ui/route-map').then((module) => ({ default: module.CourierRouteMap })),
);

type HistoryOrderRouteProps = {
  order: CourierHistoryOrder;
};

// The trip of the parcel along the roads, by the vehicle of the courier, and the two addresses.
// The order is over, so there is no courier on the map and no «Ко мне».
export function HistoryOrderRoute({ order }: HistoryOrderRouteProps) {
  const { orderId } = order;
  const routeLines = useRouteLines(
    (options) => getCourierHistoryOrderRoute(orderId, options),
    String(orderId),
  );

  return (
    <Section title={HISTORY_ORDER_TEXTS.SECTION_ROUTE}>
      <Suspense fallback={<Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />}>
        <CourierRouteMap
          pickup={order.pickup}
          delivery={order.delivery}
          route={routeLines}
          courierPoint={null}
          className={MAP_FRAME_CLASS}
        />
      </Suspense>
      <OrderRoutePoints pickup={order.pickup} delivery={order.delivery} />
    </Section>
  );
}
