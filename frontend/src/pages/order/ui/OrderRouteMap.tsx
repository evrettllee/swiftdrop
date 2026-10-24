import { PackageIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { VEHICLE_TYPE_META } from '@/entities/courier';
import { getClientOrderRoute, type OrderDetails, type VehicleType } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT, MAP_FRAME_CLASS } from '@/shared/config';
import { useRouteLines } from '@/shared/lib/route-lines';
import { CourierEtaMarker, RouteMapView, SearchPulse } from '@/shared/ui/route-map';
import { getCourierMarkerLabel } from '../lib/courier-marker';
import { withCourierLine } from '../lib/courier-line';
import { getStatusLineAnchorMs } from '../lib/status-line-anchor';
import { COURIER_ACTIVE_STATUSES, SEARCHING_STATUSES } from '../model/order-status-groups';
import type { OrderLive } from '../model/useOrderLive';
import { useMinuteNow } from '../model/useMinuteNow';

type OrderRouteMapProps = {
  order: OrderDetails;
  live: OrderLive;
  vehicleType: VehicleType | null;
};

export function OrderRouteMap({ order, live, vehicleType }: OrderRouteMapProps) {
  const { orderId, status } = order;
  const { tracking, trackingState } = live;
  const routeLines = useRouteLines(
    async (options) => {
      const route = await getClientOrderRoute(orderId, options);
      tracking.applyRoute(route);

      return route;
    },
    `${orderId}:${status}`,
    { reloadToken: live.routeReloadToken },
  );
  const { courierLeg, courierPosition, isPositionStale } = trackingState;
  const route = useMemo(() => withCourierLine(routeLines, courierLeg), [routeLines, courierLeg]);
  const nowMs = useMinuteNow(getStatusLineAnchorMs({ order, tracking: trackingState }));
  const courierPoint = COURIER_ACTIVE_STATUSES.includes(status) ? courierPosition : null;
  const VehicleIcon = vehicleType === null ? PackageIcon : VEHICLE_TYPE_META[vehicleType].icon;

  return (
    <RouteMapView
      pickup={order.pickup}
      delivery={order.delivery}
      route={route}
      courierPoint={courierPoint}
      className={MAP_FRAME_CLASS}
    >
      {SEARCHING_STATUSES.includes(status) ? <SearchPulse point={order.pickup} /> : null}
      {courierPoint === null ? null : (
        <CourierEtaMarker
          point={courierPoint}
          icon={<VehicleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          label={getCourierMarkerLabel(order, trackingState, nowMs)}
          isOffline={isPositionStale}
        />
      )}
    </RouteMapView>
  );
}
