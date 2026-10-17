import { ParcelBasicFacts, ParcelFact, ParcelFacts } from '@/entities/order';
import { formatDistanceKm } from '@/entities/price';
import type { CourierHistoryOrder } from '@/shared/api';
import { Section } from '@/shared/ui/section';
import { HISTORY_ORDER_TEXTS } from '../config/texts';
import { SIDE_COLUMN_CLASS } from '@/shared/config';

type HistoryOrderParcelProps = {
  order: CourierHistoryOrder;
};

// The parcel: a section of the page on a phone, a card next to the route on the desktop. The
// distance is shown everywhere: no other block of this page says it.
export function HistoryOrderParcel({ order }: HistoryOrderParcelProps) {
  return (
    <div
      className={`${SIDE_COLUMN_CLASS} lg:rounded-xl lg:border lg:border-transparent lg:bg-surface lg:p-6 lg:shadow-md lg:dark:border-border`}
    >
      <Section title={HISTORY_ORDER_TEXTS.SECTION_PARCEL}>
        <ParcelFacts>
          <ParcelBasicFacts parcel={order.parcel} />
          <ParcelFact label={HISTORY_ORDER_TEXTS.DISTANCE}>
            {formatDistanceKm(order.distanceKm)}
          </ParcelFact>
        </ParcelFacts>
      </Section>
    </div>
  );
}
