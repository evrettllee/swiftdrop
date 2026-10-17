import { useRef } from 'react';
import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/pagination';
import { HISTORY_PAGE_SIZE } from '../config/list';
import { HISTORY_TEXTS } from '../config/texts';
import type { HistoryList as HistoryListState } from '../model/useHistoryList';
import { HistoryCard } from './HistoryCard';
import { HistoryLoadError } from './HistoryLoadError';

type HistoryListProps = {
  list: HistoryListState;
};

// The cards with the pagination of the desktop and "show more" of a phone. A failed page keeps
// the cards and tells the failure under them.
export function HistoryList({ list }: HistoryListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const isLoading = list.status === LIST_STATUS.LOADING;

  function goToPage(page: number): void {
    list.goToPage(page);
    listRef.current?.scrollIntoView({ block: 'start' });
  }

  return (
    <>
      <ul
        ref={listRef}
        aria-label={HISTORY_TEXTS.LIST_LABEL}
        aria-busy={isLoading}
        className="flex scroll-mt-4 flex-col gap-4"
      >
        {list.items.map((item) => (
          <HistoryCard key={item.orderId} item={item} />
        ))}
      </ul>
      {list.status === LIST_STATUS.ERROR ? <HistoryLoadError onRetry={list.retry} /> : null}
      {list.totalPages > 1 ? (
        <div className="hidden lg:block">
          <Pagination
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            pageSize={HISTORY_PAGE_SIZE}
            onChange={goToPage}
          />
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <span className="text-small text-fg-secondary tabular-nums">
          {HISTORY_TEXTS.shown(list.items.length, list.total)}
        </span>
        {list.hasMore ? (
          <Button variant="secondary" fullWidth loading={isLoading} onClick={list.showMore}>
            {HISTORY_TEXTS.SHOW_MORE}
          </Button>
        ) : null}
      </div>
    </>
  );
}
