import { Link } from 'react-router';
import { formatOrderNumber, OrderStatusBadge, STATUS_AUDIENCE } from '@/entities/order';
import type { ManagerOrderListItem } from '@/shared/staff-api';
import { APP_CURRENCY } from '@/shared/config';
import { formatMoney, formatShortDateTime } from '@/shared/lib/format';
import { getManagerOrderPath } from '@/shared/routes';
import { TABLE_ALIGN, TableCell, TableRow } from '@/shared/ui/table';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { isAwaitingAssignment, shortPersonName } from '../lib/order-row';
import { ClientPhone, OrderRoute, WaitingTime } from './OrderCells';
import { RowMenu } from './RowMenu';

type OrderRowProps = {
  order: ManagerOrderListItem;
  now: number;
  isAttention: boolean;
};

function CourierAndStatus({ order, now }: Omit<OrderRowProps, 'isAttention'>) {
  return (
    <>
      <TableCell className="whitespace-nowrap">
        {order.courier === null ? (
          <span className="text-fg-muted">{MANAGER_ORDERS_TEXTS.NOT_ASSIGNED}</span>
        ) : (
          shortPersonName(order.courier.name)
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <OrderStatusBadge status={order.status} audience={STATUS_AUDIENCE.STAFF} />
          {isAwaitingAssignment(order.status) ? <WaitingTime order={order} now={now} /> : null}
        </div>
      </TableCell>
    </>
  );
}

export function OrderRow({ order, now, isAttention }: OrderRowProps) {
  const number = formatOrderNumber(order.id);

  return (
    <TableRow>
      <TableCell className="py-1.5">
        <Link
          to={getManagerOrderPath(order.id)}
          className="text-body font-semibold whitespace-nowrap tabular-nums after:absolute after:inset-0 focus-visible:outline-none"
        >
          {number}
        </Link>
        <p className="text-caption text-fg-secondary tabular-nums">
          {formatShortDateTime(order.createdAt)}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{order.client.name}</span>
          <span className="text-caption text-fg-secondary">
            <ClientPhone phone={order.client.phone} />
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-90">
        <OrderRoute order={order} />
      </TableCell>
      {isAttention ? (
        <TableCell>
          <WaitingTime order={order} now={now} />
        </TableCell>
      ) : (
        <CourierAndStatus order={order} now={now} />
      )}
      <TableCell align={TABLE_ALIGN.END} className="font-semibold whitespace-nowrap tabular-nums">
        {formatMoney(order.price, APP_CURRENCY)}
      </TableCell>
      <TableCell align={TABLE_ALIGN.END} className="w-15">
        <RowMenu orderId={order.id} orderNumber={number} />
      </TableCell>
    </TableRow>
  );
}
