import { MapPinIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { formatOrderNumber, OrderStatusBadge, STATUS_AUDIENCE } from '@/entities/order';
import type { ManagerOrderListItem } from '@/shared/staff-api';
import { APP_CURRENCY, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatMoney, formatShortDateTime } from '@/shared/lib/format';
import { getManagerOrderPath } from '@/shared/routes';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { shortPersonName } from '../lib/order-row';
import { ClientPhone, OrderRoute, WaitingTime } from './OrderCells';
import type { RowAction } from '../lib/row-actions';
import { RowActions } from './RowActions';

type OrderCardProps = {
  order: ManagerOrderListItem;
  now: number;
  isAttention: boolean;
  onAction: RowAction;
};

export function OrderCard({ order, now, isAttention, onAction }: OrderCardProps) {
  const number = formatOrderNumber(order.id);

  return (
    <article className="relative flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-md has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent dark:border dark:border-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-heading-sm font-semibold tabular-nums">
            <Link
              to={getManagerOrderPath(order.id)}
              className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
            >
              {number}
            </Link>
          </h3>
          <p className="text-caption text-fg-secondary tabular-nums">
            {formatShortDateTime(order.createdAt)}
          </p>
        </div>
        {isAttention ? (
          <WaitingTime order={order} now={now} withPrefix />
        ) : (
          <OrderStatusBadge status={order.status} audience={STATUS_AUDIENCE.STAFF} />
        )}
      </div>
      <p className="text-small">
        {order.client.name}
        {order.client.phone === null ? null : ', '}
        <ClientPhone phone={order.client.phone} />
      </p>
      <div className="flex min-w-0 items-start gap-2 text-small text-fg-secondary">
        <MapPinIcon
          size={ICON_SIZE.SMALL}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="shrink-0"
        />
        <OrderRoute order={order} isWrapped />
      </div>
      {isAttention ? null : (
        <p className="text-small text-fg-secondary">
          {MANAGER_ORDERS_TEXTS.courierLine(
            order.courier === null ? null : shortPersonName(order.courier.name),
          )}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold tabular-nums">{formatMoney(order.price, APP_CURRENCY)}</span>
        <RowActions order={order} hasAssign={isAttention} onAction={onAction} />
      </div>
    </article>
  );
}
