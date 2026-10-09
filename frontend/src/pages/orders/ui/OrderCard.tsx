import { ArrowRightIcon, CaretRightIcon, MapPinIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { formatOrderNumber, OrderStatusBadge } from '@/entities/order';
import type { OrderListItem } from '@/shared/api';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatMoney, formatShortDateTime } from '@/shared/lib/format';
import { getOrderPath } from '@/shared/routes';
import { ORDER_CARD_CLASS } from '../config/card';
import { ORDERS_TEXTS } from '../config/texts';
import { formatShortAddress } from '../lib/address';

const PIN = (
  <MapPinIcon
    size={ICON_SIZE.SMALL}
    weight={ICON_WEIGHT}
    aria-hidden="true"
    className="shrink-0 text-fg-secondary"
  />
);

type OrderCardProps = {
  order: OrderListItem;
};

// One row of "My orders": six columns on the desktop, a card of three rows on a phone.
// The whole card opens the order; "track" and "repeat" live on the order page.
export function OrderCard({ order }: OrderCardProps) {
  const pickup = formatShortAddress(order.pickup);
  const delivery = formatShortAddress(order.delivery);

  return (
    <Link
      to={getOrderPath(order.orderId)}
      className={`${ORDER_CARD_CLASS} hover:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
    >
      <div className="self-start [grid-area:no] lg:self-center">
        <h3 className="text-heading-sm font-semibold tabular-nums">
          {formatOrderNumber(order.orderId)}
        </h3>
        <p className="text-caption text-fg-secondary tabular-nums">
          {formatShortDateTime(order.createdAt)}
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-1 text-small [grid-area:rt] lg:flex-row lg:items-center lg:gap-2">
        <span className="flex min-w-0 items-center gap-1 lg:contents">
          {PIN}
          <span className="truncate" title={pickup}>
            {pickup}
          </span>
        </span>
        <ArrowRightIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="hidden shrink-0 text-fg-secondary lg:block"
        />
        <span className="flex min-w-0 items-center gap-1 lg:contents">
          {PIN}
          <span className="truncate" title={delivery}>
            {delivery}
          </span>
        </span>
      </div>
      <p className="hidden truncate text-small text-fg-secondary [grid-area:cr] lg:block">
        {ORDERS_TEXTS.COURIER_NOT_ASSIGNED}
      </p>
      <p className="font-semibold tabular-nums [grid-area:sum] lg:text-end">
        {formatMoney(order.price, order.currency)}
      </p>
      <div className="self-start justify-self-end [grid-area:st] lg:self-center lg:justify-self-start">
        <OrderStatusBadge status={order.status} />
      </div>
      <CaretRightIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="justify-self-end text-fg-secondary [grid-area:chev]"
      />
    </Link>
  );
}
