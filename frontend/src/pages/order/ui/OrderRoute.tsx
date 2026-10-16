import { formatFullAddress } from '@/entities/order';
import { getClientOrderRoute, type OrderDetails } from '@/shared/api';
import { ROUTE_POINT, ROUTE_POINT_LABELS } from '@/shared/config';
import { ROUTE_REFRESH_INTERVAL_MS, useRouteLines } from '@/shared/lib/route-lines';
import { RouteMapView } from '@/shared/ui/route-map';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
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
  const points = [
    { kind: ROUTE_POINT.PICKUP, address: order.pickup },
    { kind: ROUTE_POINT.DELIVERY, address: order.delivery },
  ] as const;

  return (
    <Section title={ORDER_DETAILS_TEXTS.SECTION_ROUTE}>
      <RouteMapView
        pickup={order.pickup}
        delivery={order.delivery}
        route={routeLines}
        className="h-40 lg:h-45"
      />
      <div className="flex flex-col gap-3">
        {points.map(({ kind, address }) => (
          <div key={kind} className="flex items-start gap-3">
            <RoutePointMark kind={kind} className="mt-2" />
            <div className="flex min-w-0 flex-col">
              <span className="text-small text-fg-secondary">{ROUTE_POINT_LABELS[kind]}</span>
              <span>{formatFullAddress(address)}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
