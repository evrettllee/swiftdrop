import { PackageIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { formatOrderNumber } from '@/entities/order';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { buildTelHref, formatPhone } from '@/shared/lib/format';
import { getManagerOrderPath } from '@/shared/routes';
import type { ManagerOrderDetails } from '@/shared/staff-api';
import type { SupportTicket } from '@/shared/support-api';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import { orderLine } from '../lib/order-line';

type TicketOrderCardProps = {
  order: NonNullable<SupportTicket['order']>;
  details: ManagerOrderDetails | null;
};

export function TicketOrderCard({ order, details }: TicketOrderCardProps) {
  const line = orderLine(order, details);
  const telHref = line.phone === null ? null : buildTelHref(line.phone);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <PackageIcon
        size={ICON_SIZE.MEDIUM}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-fg-secondary"
      />
      <div className="flex min-w-0 grow flex-col">
        <span className="font-semibold">
          {DIALOG_TEXTS.orderTitle(formatOrderNumber(order.orderId))}
        </span>
        <span className="truncate text-small text-fg-secondary tabular-nums">
          {line.text}
          {line.phone === null ? null : (
            <>
              {', '}
              {telHref === null ? (
                formatPhone(line.phone)
              ) : (
                <a href={telHref} className="hover:text-accent hover:underline">
                  {formatPhone(line.phone)}
                </a>
              )}
            </>
          )}
        </span>
      </div>
      <Link
        to={getManagerOrderPath(order.orderId)}
        className="-my-3 -me-2 inline-flex min-h-11 shrink-0 items-center rounded-sm px-2 font-semibold text-accent hover:underline"
      >
        <span className="hidden lg:inline">{DIALOG_TEXTS.OPEN_ORDER}</span>
        <span className="lg:hidden">{DIALOG_TEXTS.OPEN_ORDER_SHORT}</span>
      </Link>
    </div>
  );
}
