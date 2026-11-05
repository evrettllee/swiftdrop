import { MagnifyingGlassIcon, PackageIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import type { OrderListItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { InlineAlert } from '@/shared/ui/inline-alert';
import { ORDERS_TEXTS } from '../config/texts';
import { OrderCard } from './OrderCard';
import { OrdersListSkeleton } from './OrdersListSkeleton';

export type OrdersListEmpty = { title: string; text: string; isSearch: boolean };

type OrdersListProps = {
  status: ListStatus;
  items: readonly OrderListItem[];
  message: string | null;
  empty: OrdersListEmpty;
  onRetry: () => void;
  footer: ReactNode;
};

export function OrdersList({ status, items, message, empty, onRetry, footer }: OrdersListProps) {
  const isFailed = status === LIST_STATUS.ERROR;
  const retry = (
    <Button variant="secondary" onClick={onRetry}>
      {ORDERS_TEXTS.RETRY}
    </Button>
  );

  if (items.length === 0 && status === LIST_STATUS.LOADING) {
    return <OrdersListSkeleton />;
  }

  if (items.length === 0 && isFailed) {
    return (
      <EmptyState
        icon={WarningCircleIcon}
        title={ORDERS_TEXTS.LIST_FAILED_TITLE}
        text={message ?? ORDERS_TEXTS.LIST_FAILED}
      >
        {retry}
      </EmptyState>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={empty.isSearch ? MagnifyingGlassIcon : PackageIcon}
        title={empty.title}
        text={empty.text}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-4">
        {items.map((order) => (
          <OrderCard key={order.orderId} order={order} />
        ))}
      </div>
      {isFailed ? (
        <InlineAlert variant="error" title={ORDERS_TEXTS.LIST_FAILED_TITLE}>
          <Button variant="text" onClick={onRetry}>
            {ORDERS_TEXTS.RETRY}
          </Button>
        </InlineAlert>
      ) : null}
      {footer}
    </div>
  );
}
