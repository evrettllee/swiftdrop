import { memo } from 'react';
import { formatOrderNumber, formatParcelWeight, OrderStatusBadge } from '@/entities/order';
import { formatDistanceKm } from '@/entities/price';
import type { CourierHistoryItem } from '@/shared/api';
import { formatShortDateTime } from '@/shared/lib/format';
import { HISTORY_CARD_CLASS } from '../config/card';
import { HISTORY_TEXTS } from '../config/texts';
import { HistoryRoute } from './HistoryRoute';

type HistoryCardProps = {
  item: CourierHistoryItem;
};

// A finished order: five columns on the desktop, three rows on a phone. Not a link, unlike the
// mockup: a courier has no page of a finished order. Memoised, so "show more" renders only the
// new cards.
export const HistoryCard = memo(function HistoryCard({ item }: HistoryCardProps) {
  const distance = formatDistanceKm(item.distanceKm);
  const weight = formatParcelWeight(item);

  return (
    <li className={HISTORY_CARD_CLASS}>
      <div className="self-start [grid-area:no] lg:self-center">
        <h2 className="text-heading-sm font-semibold tabular-nums">
          {formatOrderNumber(item.orderId)}
        </h2>
        <p className="text-caption text-fg-secondary tabular-nums">
          {item.finishedAt === null ? HISTORY_TEXTS.NO_DATE : formatShortDateTime(item.finishedAt)}
        </p>
      </div>
      <HistoryRoute pickup={item.pickup} delivery={item.delivery} />
      <p className="hidden text-small tabular-nums [grid-area:km] lg:block">{distance}</p>
      <p className="hidden text-small tabular-nums [grid-area:kg] lg:block">{weight}</p>
      <p className="text-small text-fg-secondary tabular-nums [grid-area:bot] lg:hidden">
        {HISTORY_TEXTS.details(distance, weight)}
      </p>
      <div className="self-start justify-self-end [grid-area:st] lg:self-center lg:justify-self-start">
        <OrderStatusBadge status={item.status} />
      </div>
    </li>
  );
});
