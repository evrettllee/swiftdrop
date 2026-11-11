import { PackageIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  formatOrderNumber,
  getOrderStatusMeta,
  OrderStatusBadge,
  STATUS_AUDIENCE,
} from '@/entities/order';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { MyTicket } from '@/shared/support-api';
import { LinkButton } from '@/shared/ui/button';
import { SUPPORT_TEXTS } from '../config/texts';
import { THREAD_TEXTS } from '../config/thread-texts';

type TicketOrderProps = {
  order: NonNullable<MyTicket['order']>;
  to: string;
};

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-small">
      <dt className="text-fg-secondary">{label}</dt>
      <dd className="min-w-0 truncate text-end font-semibold">{children}</dd>
    </div>
  );
}

export function TicketOrderAside({ order, to }: TicketOrderProps) {
  return (
    <aside
      aria-labelledby="ticket-order-title"
      className="flex flex-col gap-4 self-start rounded-xl bg-surface p-6 shadow-md dark:border dark:border-border"
    >
      <h2 id="ticket-order-title" className="text-heading-sm font-semibold">
        {THREAD_TEXTS.ORDER}
      </h2>
      <dl className="flex flex-col gap-2">
        <Fact label={THREAD_TEXTS.NUMBER}>
          <span className="tabular-nums">{formatOrderNumber(order.orderId)}</span>
        </Fact>
        <Fact label={THREAD_TEXTS.STATUS}>
          <span className="font-normal">
            <OrderStatusBadge status={order.status} />
          </span>
        </Fact>
        <Fact label={THREAD_TEXTS.WHERE}>{order.deliveryAddress}</Fact>
      </dl>
      <LinkButton variant="secondary" fullWidth to={to}>
        {THREAD_TEXTS.OPEN_ORDER}
      </LinkButton>
    </aside>
  );
}

export function TicketOrderCard({ order, to }: TicketOrderProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <PackageIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
      <div className="flex min-w-0 grow flex-col">
        <span className="font-semibold tabular-nums">
          {SUPPORT_TEXTS.orderNumber(formatOrderNumber(order.orderId))}
        </span>
        <span className="truncate text-small text-fg-secondary">
          {getOrderStatusMeta(order.status, STATUS_AUDIENCE.CLIENT).label}
        </span>
      </div>
      <Link
        to={to}
        className="-my-3 -me-2 inline-flex min-h-11 shrink-0 items-center rounded-sm px-2 font-semibold text-accent hover:underline"
      >
        {THREAD_TEXTS.OPEN_ORDER_SHORT}
      </Link>
    </div>
  );
}
