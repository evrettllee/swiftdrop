import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { Pagination } from '@/shared/ui/pagination';
import { ORDERS_PAGE_SIZE } from '../config/list';
import { ORDERS_TEXTS } from '../config/texts';
import type { MyOrders } from '../model/useMyOrders';
import { type OrdersListEmpty, OrdersList } from './OrdersList';

type OrdersContentProps = {
  orders: MyOrders;
  empty: OrdersListEmpty;
};

export function OrdersContent({ orders, empty }: OrdersContentProps) {
  const { pages, feed, params } = orders;

  if (orders.isDesktop) {
    return (
      <OrdersList
        status={pages.status}
        items={pages.items}
        message={pages.message}
        empty={empty}
        onRetry={pages.retry}
        footer={
          pages.totalPages > 1 ? (
            <Pagination
              page={params.values.page}
              totalPages={pages.totalPages}
              total={pages.total}
              pageSize={ORDERS_PAGE_SIZE}
              onChange={(page) => params.update({ page })}
            />
          ) : null
        }
      />
    );
  }

  return (
    <OrdersList
      status={feed.status}
      items={feed.items}
      message={feed.message}
      empty={empty}
      onRetry={feed.retry}
      footer={
        feed.hasMore ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="secondary"
              fullWidth
              loading={feed.status === LIST_STATUS.LOADING}
              onClick={feed.showMore}
            >
              {ORDERS_TEXTS.SHOW_MORE}
            </Button>
            <span className="text-caption text-fg-secondary tabular-nums">
              {ORDERS_TEXTS.shown(feed.items.length, feed.total)}
            </span>
          </div>
        ) : null
      }
    />
  );
}
