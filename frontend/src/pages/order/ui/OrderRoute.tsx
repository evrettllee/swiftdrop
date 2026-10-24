import { useMemo } from 'react';
import { OrderRoutePoints } from '@/entities/order';
import { getClientOrderRoute, type OrderDetails } from '@/shared/api';
import { useRouteLines } from '@/shared/lib/route-lines';
import type { CourierLeg } from '@/shared/realtime';
import { RouteMapView, SearchPulse } from '@/shared/ui/route-map';
import { Section } from '@/shared/ui/section';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import { ORDER_COURIER_TEXTS } from '../config/tracking';
import { withCourierLine } from '../lib/courier-line';
import type { OrderTracking } from '../model/order-tracking';
import { SEARCHING_STATUSES } from '../model/order-status-groups';

type OrderRouteProps = {
  order: OrderDetails;
  // Takes the position of the courier and their arrival at the pickup point from the route.
  tracking: OrderTracking;
  // The line of the courier the page knows now: order:eta changes it without a request.
  courierLeg: CourierLeg | null;
  // Asks for the route again after a lost connection.
  reloadToken: number;
};

export function OrderRoute({ order, tracking, courierLeg, reloadToken }: OrderRouteProps) {
  const { orderId, status } = order;
  const isSearching = SEARCHING_STATUSES.includes(status);
  // The route is asked for when the page opens, when the status changes and after a lost
  // connection; between those the room of the order brings the line of the courier.
  const routeLines = useRouteLines(
    async (options) => {
      const route = await getClientOrderRoute(orderId, options);
      tracking.applyRoute(route);

      return route;
    },
    `${orderId}:${status}`,
    { reloadToken },
  );
  // A new object only when a line changed: the map fits its route again for every new one.
  const route = useMemo(() => withCourierLine(routeLines, courierLeg), [routeLines, courierLeg]);

  return (
    <Section title={ORDER_DETAILS_TEXTS.SECTION_ROUTE}>
      <RouteMapView
        pickup={order.pickup}
        delivery={order.delivery}
        route={route}
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
