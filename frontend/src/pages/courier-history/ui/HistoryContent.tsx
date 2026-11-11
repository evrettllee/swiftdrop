import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/pagination';
import { LIST_PAGE_SIZE } from '@/shared/lib/list-params';
import { HISTORY_TEXTS } from '../config/texts';
import type { HistoryState } from '../model/useHistory';
import { type HistoryEmpty, HistoryList } from './HistoryList';

type HistoryContentProps = {
  history: HistoryState;
  empty: HistoryEmpty;
};

export function HistoryContent({ history, empty }: HistoryContentProps) {
  const { pages, feed, params } = history;

  if (history.isDesktop) {
    return (
      <HistoryList
        status={pages.status}
        items={pages.items}
        empty={empty}
        onRetry={pages.retry}
        footer={
          pages.totalPages > 1 ? (
            <Pagination
              page={params.values.page}
              totalPages={pages.totalPages}
              total={pages.total}
              pageSize={LIST_PAGE_SIZE}
              onChange={(page) => params.update({ page })}
            />
          ) : null
        }
      />
    );
  }

  return (
    <HistoryList
      status={feed.status}
      items={feed.items}
      empty={empty}
      onRetry={feed.retry}
      footer={
        feed.hasMore ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-small text-fg-secondary tabular-nums">
              {HISTORY_TEXTS.shown(feed.items.length, feed.total)}
            </span>
            <Button
              variant="secondary"
              fullWidth
              loading={feed.status === LIST_STATUS.LOADING}
              onClick={feed.showMore}
            >
              {HISTORY_TEXTS.SHOW_MORE}
            </Button>
          </div>
        ) : null
      }
    />
  );
}
