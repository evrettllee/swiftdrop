import { Skeleton } from '@/shared/ui/skeleton';
import { HISTORY_ORDER_TEXTS } from '../config/texts';
import {
  MAIN_COLUMN_CLASS,
  MAP_FRAME_CLASS,
  SIDE_COLUMN_CLASS,
  SIDE_COLUMN_LAYOUT_CLASS,
} from '@/shared/config';

// The header, the map with the points and the card of the parcel, as high as the real page.
export function HistoryOrderSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={HISTORY_ORDER_TEXTS.LOADING}
      className="flex flex-col gap-6 lg:gap-8"
    >
      <div className="flex flex-col gap-2 lg:gap-4">
        <Skeleton className="h-11 w-28 rounded-md" />
        <Skeleton className="h-8 w-52 rounded-sm lg:h-10" />
        <Skeleton className="h-5 w-40 rounded-sm" />
      </div>
      <div className={SIDE_COLUMN_LAYOUT_CLASS}>
        <div className={`${MAIN_COLUMN_CLASS} flex flex-col gap-4`}>
          <Skeleton className="h-7 w-28 rounded-sm" />
          <Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />
          <Skeleton className="h-12 w-3/4 rounded-sm" />
          <Skeleton className="h-12 w-2/3 rounded-sm" />
        </div>
        <Skeleton className={`${SIDE_COLUMN_CLASS} h-44 w-full rounded-xl`} />
      </div>
    </div>
  );
}
