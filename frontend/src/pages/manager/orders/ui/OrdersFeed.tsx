import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import type { useOrdersFeed } from '../model/useOrdersFeed';
import { OrderCard } from './OrderCard';

type OrdersFeedProps = {
  feed: ReturnType<typeof useOrdersFeed>;
  now: number;
  isAttention: boolean;
};

export function OrdersFeed({ feed, now, isAttention }: OrdersFeedProps) {
  const isLoading = feed.status === LIST_STATUS.LOADING;

  return (
    <div className="flex flex-col gap-4" aria-busy={isLoading}>
      <div className="flex flex-col gap-4">
        {feed.items.map((order) => (
          <OrderCard key={order.id} order={order} now={now} isAttention={isAttention} />
        ))}
      </div>
      {feed.status === LIST_STATUS.ERROR ? (
        <InlineAlert variant="error" title={MANAGER_ORDERS_TEXTS.LIST_FAILED_TITLE}>
          <Button variant="text" onClick={feed.showMore}>
            {MANAGER_ORDERS_TEXTS.RETRY}
          </Button>
        </InlineAlert>
      ) : null}
      {feed.hasMore ? (
        <div className="flex flex-col items-center gap-2">
          <Button variant="secondary" fullWidth loading={isLoading} onClick={feed.showMore}>
            {MANAGER_ORDERS_TEXTS.SHOW_MORE}
          </Button>
          <span className="text-caption text-fg-secondary tabular-nums">
            {MANAGER_ORDERS_TEXTS.shown(feed.items.length, feed.total)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
