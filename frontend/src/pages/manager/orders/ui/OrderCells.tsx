import { ArrowRightIcon, ClockIcon } from '@phosphor-icons/react';
import type { ManagerOrderListItem } from '@/shared/staff-api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatPhone } from '@/shared/lib/format';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { formatStreet, isLongWait, waitingMinutes } from '../lib/order-row';

type OrderProps = {
  order: ManagerOrderListItem;
};

type OrderRouteProps = OrderProps & {
  isWrapped?: boolean;
};

export function OrderRoute({ order, isWrapped = false }: OrderRouteProps) {
  const from = formatStreet(order.route.from);
  const to = formatStreet(order.route.to);
  const partClass = isWrapped ? '' : 'truncate';

  return (
    <span className={`flex min-w-0 items-center gap-x-2 ${isWrapped ? 'flex-wrap' : ''}`}>
      <span className={partClass} title={from}>
        {from}
      </span>
      <ArrowRightIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-label={MANAGER_ORDERS_TEXTS.ROUTE_TO}
        className="shrink-0 text-fg-secondary"
      />
      <span className={partClass} title={to}>
        {to}
      </span>
    </span>
  );
}

export function ClientPhone({ phone }: { phone: string | null }) {
  return phone === null ? null : <span className="tabular-nums">{formatPhone(phone)}</span>;
}

type WaitingProps = OrderProps & {
  now: number;
  withPrefix?: boolean;
};

export function WaitingTime({ order, now, withPrefix = false }: WaitingProps) {
  const minutes = waitingMinutes(order.statusChangedAt, now);
  const isLong = isLongWait(order.statusChangedAt, now);

  return (
    <span
      className={`inline-flex items-center gap-1 text-small whitespace-nowrap tabular-nums ${isLong ? 'font-semibold text-warning' : 'text-fg'}`}
    >
      <ClockIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
      {withPrefix
        ? MANAGER_ORDERS_TEXTS.waitingLong(minutes)
        : MANAGER_ORDERS_TEXTS.waiting(minutes)}
    </span>
  );
}
