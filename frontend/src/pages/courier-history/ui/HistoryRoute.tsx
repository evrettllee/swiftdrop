import { ArrowRightIcon } from '@phosphor-icons/react';
import { formatShortAddress } from '@/entities/order';
import type { CourierHistoryItem } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT, ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import { RoutePointMark } from '@/shared/ui/route-point-mark';

type HistoryRouteProps = Pick<CourierHistoryItem, 'pickup' | 'delivery'>;

function RoutePoint({ kind, address }: { kind: RoutePointKind; address: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <RoutePointMark kind={kind} />
      <span className="truncate" title={address}>
        {address}
      </span>
    </span>
  );
}

// From where to where: one line with an arrow on the desktop, two lines on a phone.
export function HistoryRoute({ pickup, delivery }: HistoryRouteProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 text-small [grid-area:rt] lg:flex-row lg:items-center lg:gap-2">
      <RoutePoint kind={ROUTE_POINT.PICKUP} address={formatShortAddress(pickup)} />
      <ArrowRightIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="hidden shrink-0 text-fg-secondary lg:block"
      />
      <RoutePoint kind={ROUTE_POINT.DELIVERY} address={formatShortAddress(delivery)} />
    </div>
  );
}
