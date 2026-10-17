import { Skeleton } from '@/shared/ui/skeleton';
import { MAP_FRAME_CLASS } from '../config/map';
import { HISTORY_ORDER_TEXTS } from '../config/texts';

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
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-7 w-28 rounded-sm" />
          <Skeleton className={`${MAP_FRAME_CLASS} rounded-lg`} />
          <Skeleton className="h-12 w-3/4 rounded-sm" />
          <Skeleton className="h-12 w-2/3 rounded-sm" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    </div>
  );
}
