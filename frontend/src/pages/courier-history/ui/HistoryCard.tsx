import { CaretRightIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { Link } from 'react-router';
import { formatOrderNumber, formatParcelWeight, OrderStatusBadge } from '@/entities/order';
import { formatDistanceKm } from '@/entities/price';
import type { CourierHistoryItem } from '@/shared/api';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatShortDateTime } from '@/shared/lib/format';
import { getCourierHistoryOrderPath } from '@/shared/routes';
import { HISTORY_CARD_CLASS } from '../config/card';
import { HISTORY_TEXTS } from '../config/texts';
import { HistoryRoute } from './HistoryRoute';

type HistoryCardProps = {
  item: CourierHistoryItem;
  listSearch: string;
};

// A finished order: six columns on the desktop, three rows on a phone. The whole card opens the
// order. Memoised, so the renders that change nothing of a card skip it.
export const HistoryCard = memo(function HistoryCard({ item, listSearch }: HistoryCardProps) {
  const distance = formatDistanceKm(item.distanceKm);
  const weight = formatParcelWeight(item);

  return (
    <li>
      <Link
        to={getCourierHistoryOrderPath(item.orderId, listSearch)}
        className={`${HISTORY_CARD_CLASS} hover:bg-surface-muted ${COLOR_TRANSITION_CLASS}`}
      >
        <div className="self-start [grid-area:no] lg:self-center">
          <h2 className="text-heading-sm font-semibold tabular-nums">
            {formatOrderNumber(item.orderId)}
          </h2>
          <p className="text-caption text-fg-secondary tabular-nums">
            {item.finishedAt === null
              ? HISTORY_TEXTS.NO_DATE
              : formatShortDateTime(item.finishedAt)}
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
        <CaretRightIcon
          size={ICON_SIZE.MEDIUM}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="justify-self-end text-fg-secondary [grid-area:chev]"
        />
      </Link>
    </li>
  );
});
