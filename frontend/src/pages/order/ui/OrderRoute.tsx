import { OrderRoutePoints } from '@/entities/order';
import { getClientOrderRoute, type OrderDetails } from '@/shared/api';
import { ROUTE_REFRESH_INTERVAL_MS, useRouteLines } from '@/shared/lib/route-lines';
import { RouteMapView } from '@/shared/ui/route-map';
import { Section } from '@/shared/ui/section';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { COURIER_ACTIVE_STATUSES } from '../model/order-status-groups';

type OrderRouteProps = {
  order: OrderDetails;
};

export function OrderRoute({ order }: OrderRouteProps) {
  const { orderId } = order;
  // The page does not see the courier move, so while the order is with them the route is asked for
  // again on the interval: the backend knows where the courier is. Otherwise it is asked for once.
  const routeLines = useRouteLines(
    (options) => getClientOrderRoute(orderId, options),
    String(orderId),
    {
      refreshIntervalMs: COURIER_ACTIVE_STATUSES.includes(order.status)
        ? ROUTE_REFRESH_INTERVAL_MS
        : null,
    },
  );
  return (
    <Section title={ORDER_DETAILS_TEXTS.SECTION_ROUTE}>
      <RouteMapView
        pickup={order.pickup}
        delivery={order.delivery}
        route={routeLines}
        className="h-40 lg:h-45"
      />
      <OrderRoutePoints pickup={order.pickup} delivery={order.delivery} />
    </Section>
  );
}
