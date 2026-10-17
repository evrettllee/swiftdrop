import type { ReactNode } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { HISTORY_CARD_CLASS } from '../config/card';
import { HISTORY_TEXTS } from '../config/texts';

// The widths of the route lines differ from card to card, as on the list of the client. The last
// card is for the desktop only.
const ROWS = [
  { first: 'w-[60%] lg:w-[80%]', second: 'w-[52%]', card: '' },
  { first: 'w-[70%] lg:w-[72%]', second: 'w-[44%]', card: '' },
  { first: 'w-[56%] lg:w-[84%]', second: 'w-[64%]', card: '' },
  { first: 'w-[60%] lg:w-[76%]', second: 'w-[52%]', card: 'max-lg:hidden' },
] as const;

type LineProps = {
  // The type of the text the line stands for: the line is as high as one line of it.
  text: string;
  className?: string;
  children: ReactNode;
};

function Line({ text, className = '', children }: LineProps) {
  return <div className={`flex h-[1lh] items-center ${text} ${className}`}>{children}</div>;
}

// Cards of the same height as the real ones, so the page does not jump when the history comes.
export function HistoryListSkeleton() {
  return (
    <div aria-busy="true" aria-label={HISTORY_TEXTS.LIST_LOADING} className="flex flex-col gap-4">
      {ROWS.map((row, index) => (
        <div key={index} className={`${HISTORY_CARD_CLASS} ${row.card}`}>
          <div className="self-start [grid-area:no] lg:self-center">
            <Line text="text-heading-sm">
              <Skeleton className="h-5 w-22 rounded-sm" />
            </Line>
            <Line text="text-caption">
              <Skeleton className="h-3 w-20 rounded-sm" />
            </Line>
          </div>
          <div className="flex flex-col gap-1 [grid-area:rt]">
            <Line text="text-small">
              <Skeleton className={`h-4 rounded-sm ${row.first}`} />
            </Line>
            <Line text="text-small" className="lg:hidden">
              <Skeleton className={`h-4 rounded-sm ${row.second}`} />
            </Line>
          </div>
          <Line text="text-small" className="max-lg:hidden [grid-area:km]">
            <Skeleton className="h-4 w-16 rounded-sm" />
          </Line>
          <Line text="text-small" className="max-lg:hidden [grid-area:kg]">
            <Skeleton className="h-4 w-12 rounded-sm" />
          </Line>
          <Line text="text-small" className="lg:hidden [grid-area:bot]">
            <Skeleton className="h-4 w-28 rounded-sm" />
          </Line>
          <Line
            text="text-small"
            className="gap-2 self-start justify-self-end [grid-area:st] lg:self-center lg:justify-self-start"
          >
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-4 w-21 rounded-sm" />
          </Line>
          <Skeleton className="size-5 justify-self-end rounded-sm [grid-area:chev]" />
        </div>
      ))}
    </div>
  );
}
