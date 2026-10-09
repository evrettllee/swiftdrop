import { Skeleton } from '@/shared/ui/skeleton';
import { ORDER_CARD_CLASS } from '../config/card';
import { ORDERS_TEXTS } from '../config/texts';

// The widths of the route lines differ from card to card, as in the mockup: the first line is
// the whole route on the desktop, a phone shows two lines. The last card is for the desktop only.
const ROWS = [
  { first: 'w-[60%] lg:w-[80%]', second: 'w-[52%]', card: '' },
  { first: 'w-[70%] lg:w-[72%]', second: 'w-[44%]', card: '' },
  { first: 'w-[56%] lg:w-[84%]', second: 'w-[64%]', card: '' },
  { first: 'w-[60%] lg:w-[76%]', second: 'w-[52%]', card: 'max-lg:hidden' },
] as const;

export function OrdersListSkeleton() {
  return (
    <div aria-busy="true" aria-label={ORDERS_TEXTS.LIST_LOADING} className="flex flex-col gap-4">
      {ROWS.map((row, index) => (
        <div key={index} className={`${ORDER_CARD_CLASS} ${row.card}`}>
          <div className="flex flex-col gap-2 self-start [grid-area:no] lg:self-center">
            <Skeleton className="h-5 w-22 rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
          <div className="flex flex-col gap-2 [grid-area:rt]">
            <Skeleton className={`h-4 rounded-sm ${row.first}`} />
            <Skeleton className={`h-4 rounded-sm lg:hidden ${row.second}`} />
          </div>
          <Skeleton className="hidden h-4 w-24 rounded-sm [grid-area:cr] lg:block" />
          <Skeleton className="h-5 w-18 rounded-sm [grid-area:sum] lg:w-17 lg:justify-self-end" />
          <div className="flex items-center gap-2 self-start justify-self-end [grid-area:st] lg:self-center lg:justify-self-start">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-21 rounded-sm" />
          </div>
          <Skeleton className="size-5 justify-self-end rounded-sm [grid-area:chev]" />
        </div>
      ))}
    </div>
  );
}
