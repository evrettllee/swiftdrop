import { ArrowLeftIcon } from '@phosphor-icons/react';
import { formatOrderNumber, OrderStatusBadge } from '@/entities/order';
import type { CourierHistoryOrder } from '@/shared/api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatFullDateTime, formatShortDateTime } from '@/shared/lib/format';
import { getCourierHistoryPath } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { HISTORY_ORDER_TEXTS } from '../config/texts';

type HistoryOrderHeaderProps = {
  order: CourierHistoryOrder;
  // The page of the history the order was opened from: the way back leads to it.
  historyPage: number;
};

// The way back, the number with the status, the end of the order. The desktop puts the status next
// to the title and the full date under it; a phone puts the status and the short date in a row.
export function HistoryOrderHeader({ order, historyPage }: HistoryOrderHeaderProps) {
  const finishedAt = order.finishedAt;

  return (
    <header className="flex flex-col gap-2 lg:gap-4">
      <div className="-ms-4 self-start">
        <LinkButton
          variant="text"
          to={getCourierHistoryPath(historyPage)}
          icon={<ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
        >
          {HISTORY_ORDER_TEXTS.BACK}
        </LinkButton>
      </div>
      <div className="flex flex-wrap items-baseline gap-4">
        <PageTitle className="tabular-nums">
          {HISTORY_ORDER_TEXTS.title(formatOrderNumber(order.orderId))}
        </PageTitle>
        <span className="hidden lg:inline-flex">
          <OrderStatusBadge status={order.status} />
        </span>
      </div>
      <p className="hidden text-small text-fg-secondary tabular-nums lg:block">
        {HISTORY_ORDER_TEXTS.finishedAt(
          finishedAt === null ? HISTORY_ORDER_TEXTS.NO_DATE : formatFullDateTime(finishedAt),
        )}
      </p>
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <OrderStatusBadge status={order.status} />
        <span className="text-small text-fg-secondary tabular-nums">
          {finishedAt === null ? HISTORY_ORDER_TEXTS.NO_DATE : formatShortDateTime(finishedAt)}
        </span>
      </div>
    </header>
  );
}
