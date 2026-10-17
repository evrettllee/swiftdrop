import { OrderRoutePoints } from '@/entities/order';
import { getClientOrderRoute, type OrderDetails } from '@/shared/api';
import { ROUTE_REFRESH_INTERVAL_MS, useRouteLines } from '@/shared/lib/route-lines';
import { RouteMapView, SearchPulse } from '@/shared/ui/route-map';
import { Section } from '@/shared/ui/section';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { ORDER_COURIER_TEXTS } from '../config/tracking';
import { COURIER_ACTIVE_STATUSES, SEARCHING_STATUSES } from '../model/order-status-groups';

type OrderRouteProps = {
  order: OrderDetails;
};

export function OrderRoute({ order }: OrderRouteProps) {
  const { orderId, status } = order;
  const isSearching = SEARCHING_STATUSES.includes(status);
  // The page does not see the courier move, so while the order is with them the route is asked for
  // again on the interval: the backend knows where the courier is. Otherwise it is asked for once,
  // and again when the status changes.
  const routeLines = useRouteLines(
    (options) => getClientOrderRoute(orderId, options),
    `${orderId}:${status}`,
    {
      refreshIntervalMs: COURIER_ACTIVE_STATUSES.includes(status)
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
      >
        {isSearching ? <SearchPulse point={order.pickup} /> : null}
      </RouteMapView>
      {/* The region stays in the page, so the text that appears in it is read out politely. */}
      <p aria-live="polite" className="font-semibold empty:hidden">
        {isSearching ? ORDER_COURIER_TEXTS.SEARCHING : null}
      </p>
      <OrderRoutePoints pickup={order.pickup} delivery={order.delivery} />
    </Section>
  );
}
