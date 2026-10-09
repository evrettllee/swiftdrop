import { PackageIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { LIST_STATUS } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { Pagination } from '@/shared/ui/pagination';
import { ORDERS_PAGE_SIZE } from '../config/list';
import { ORDERS_EMPTY_TEXTS, ORDERS_TEXTS } from '../config/texts';
import type { OrderListFilter } from '../model/order-list';
import type { useOrdersList } from '../model/useOrdersList';
import { OrderCard } from './OrderCard';
import { OrdersListSkeleton } from './OrdersListSkeleton';

type OrdersListProps = {
  filter: OrderListFilter;
  list: ReturnType<typeof useOrdersList>;
};

// The content of a tab: the skeleton, an empty or failed state, or the cards with the pagination
// of the desktop and the "show more" button of a phone.
export function OrdersList({ filter, list }: OrdersListProps) {
  const isLoading = list.status === LIST_STATUS.LOADING;
  const isFailed = list.status === LIST_STATUS.ERROR;
  const hasItems = list.items.length > 0;
  let content: ReactNode;

  if (!hasItems && isLoading) {
    content = <OrdersListSkeleton />;
  } else if (!hasItems && isFailed) {
    content = (
      <EmptyState
        icon={WarningCircleIcon}
        title={ORDERS_TEXTS.LIST_FAILED_TITLE}
        text={list.message ?? ORDERS_TEXTS.LIST_FAILED}
      >
        <Button variant="secondary" onClick={() => list.retry()}>
          {ORDERS_TEXTS.RETRY}
        </Button>
      </EmptyState>
    );
  } else if (!hasItems) {
    content = <EmptyState icon={PackageIcon} {...ORDERS_EMPTY_TEXTS[filter]} />;
  } else {
    content = (
      <>
        <div className="flex flex-col gap-4">
          {list.items.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
        {isFailed ? (
          <InlineAlert variant="error" title={ORDERS_TEXTS.LIST_FAILED_TITLE}>
            <Button variant="text" onClick={() => list.retry()}>
              {ORDERS_TEXTS.RETRY}
            </Button>
          </InlineAlert>
        ) : null}
        {list.totalPages > 1 ? (
          <div className="hidden lg:block">
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              total={list.total}
              pageSize={ORDERS_PAGE_SIZE}
              onChange={(page) => list.goToPage(page)}
            />
          </div>
        ) : null}
        {list.hasMore ? (
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <Button
              variant="secondary"
              fullWidth
              loading={isLoading}
              onClick={() => list.showMore()}
            >
              {ORDERS_TEXTS.SHOW_MORE}
            </Button>
            <span className="text-caption text-fg-secondary tabular-nums">
              {ORDERS_TEXTS.shown(list.items.length, list.total)}
            </span>
          </div>
        ) : null}
      </>
    );
  }

  return <div className="flex flex-col gap-4 lg:gap-6">{content}</div>;
}
