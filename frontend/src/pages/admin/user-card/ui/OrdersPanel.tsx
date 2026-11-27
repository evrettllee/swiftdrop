import { ArrowRightIcon } from '@phosphor-icons/react';
import { MANAGED_ROLE } from '@/entities/admin-user';
import { formatOrderNumber, OrderStatusBadge, STATUS_AUDIENCE } from '@/entities/order';
import { APP_CURRENCY, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatMoney, formatShortDate, formatShortDay } from '@/shared/lib/format';
import { Panel } from '@/shared/ui/panel';
import { TABLE_ALIGN, TableCell, TableHeaderCell } from '@/shared/ui/table';
import type { AdminUserCard, RecentOrder } from '../api/admin-user-card';
import { USER_CARD_TEXTS as TEXTS } from '../config/texts';
import { ordersSummary } from '../lib/card-view';

const EDGE_CELL_CLASS = 'first:ps-0 last:pe-0';

function Route({ order }: { order: RecentOrder }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate">{order.from}</span>
      <ArrowRightIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-label={TEXTS.ROUTE_TO}
        className="shrink-0 text-fg-secondary"
      />
      <span className="truncate">{order.to}</span>
    </span>
  );
}

function Price({ price }: { price: number | null }) {
  return price === null ? null : (
    <span className="font-semibold whitespace-nowrap tabular-nums">
      {formatMoney(price, APP_CURRENCY)}
    </span>
  );
}

function OrdersTable({ orders, hasPrice }: { orders: RecentOrder[]; hasPrice: boolean }) {
  return (
    <table aria-label={TEXTS.ORDERS} className="w-full border-collapse text-small">
      <thead>
        <tr>
          <TableHeaderCell className={EDGE_CELL_CLASS}>{TEXTS.COLUMN_ORDER}</TableHeaderCell>
          <TableHeaderCell className={EDGE_CELL_CLASS}>{TEXTS.COLUMN_ROUTE}</TableHeaderCell>
          {hasPrice ? (
            <TableHeaderCell align={TABLE_ALIGN.END} className={EDGE_CELL_CLASS}>
              {TEXTS.COLUMN_SUM}
            </TableHeaderCell>
          ) : null}
          <TableHeaderCell className={`min-w-38 ${EDGE_CELL_CLASS}`}>
            {TEXTS.COLUMN_STATUS}
          </TableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.orderId} className="[&:last-child>td]:border-b-0">
            <TableCell className={EDGE_CELL_CLASS}>
              <span className="flex flex-col">
                <span className="text-body font-semibold whitespace-nowrap tabular-nums">
                  {formatOrderNumber(order.orderId)}
                </span>
                <span className="text-caption text-fg-secondary tabular-nums">
                  {formatShortDate(order.createdAt)}
                </span>
              </span>
            </TableCell>
            <TableCell className={`max-w-0 w-full ${EDGE_CELL_CLASS}`}>
              <Route order={order} />
            </TableCell>
            {hasPrice ? (
              <TableCell align={TABLE_ALIGN.END} className={EDGE_CELL_CLASS}>
                <Price price={order.price} />
              </TableCell>
            ) : null}
            <TableCell className={EDGE_CELL_CLASS}>
              <OrderStatusBadge status={order.status} audience={STATUS_AUDIENCE.STAFF} />
            </TableCell>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OrdersList({ orders }: { orders: RecentOrder[] }) {
  return (
    <ul aria-label={TEXTS.ORDERS} className="flex flex-col">
      {orders.map((order) => (
        <li
          key={order.orderId}
          className="flex flex-col gap-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="font-semibold tabular-nums">
              {formatOrderNumber(order.orderId)}
              <span className="text-caption font-normal text-fg-secondary">
                {` · ${formatShortDay(order.createdAt)}`}
              </span>
            </span>
            <OrderStatusBadge status={order.status} audience={STATUS_AUDIENCE.STAFF} />
          </span>
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-small text-fg-secondary">
              {`${order.from} → ${order.to}`}
            </span>
            <Price price={order.price} />
          </span>
        </li>
      ))}
    </ul>
  );
}

type OrdersPanelProps = {
  card: AdminUserCard;
  isDesktop: boolean;
};

export function OrdersPanel({ card, isDesktop }: OrdersPanelProps) {
  const isCourier = card.role === MANAGED_ROLE.COURIER;
  const orders = card.orders.recent;
  const summary = ordersSummary(card);

  return (
    <Panel
      title={isCourier ? TEXTS.DELIVERIES : TEXTS.ORDERS}
      aside={
        summary === null ? undefined : (
          <span className="text-small text-fg-secondary tabular-nums">{summary}</span>
        )
      }
    >
      {orders.length === 0 ? (
        <p className="text-small text-fg-secondary">
          {isCourier ? TEXTS.NO_DELIVERIES : TEXTS.NO_ORDERS}
        </p>
      ) : null}
      {orders.length > 0 && isDesktop ? (
        <OrdersTable orders={orders} hasPrice={!isCourier} />
      ) : null}
      {orders.length > 0 && !isDesktop ? <OrdersList orders={orders} /> : null}
    </Panel>
  );
}
