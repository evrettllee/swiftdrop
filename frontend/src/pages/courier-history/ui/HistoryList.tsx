import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import type { CourierHistoryItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { EmptyState } from '@/shared/ui/empty-state';
import { HISTORY_TEXTS } from '../config/texts';
import { HistoryCard } from './HistoryCard';
import { HistoryListSkeleton } from './HistoryListSkeleton';
import { HistoryLoadError } from './HistoryLoadError';

export type HistoryEmpty = { title: string; text: string };

type HistoryListProps = {
  status: ListStatus;
  items: readonly CourierHistoryItem[];
  empty: HistoryEmpty;
  onRetry: () => void;
  footer: ReactNode;
};

export function HistoryList({ status, items, empty, onRetry, footer }: HistoryListProps) {
  const [searchParams] = useSearchParams();
  const listSearch = searchParams.toString();

  if (items.length === 0 && status === LIST_STATUS.LOADING) {
    return <HistoryListSkeleton />;
  }

  if (items.length === 0 && status === LIST_STATUS.ERROR) {
    return <HistoryLoadError onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return <EmptyState icon={MagnifyingGlassIcon} title={empty.title} text={empty.text} />;
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <ul
        aria-label={HISTORY_TEXTS.LIST_LABEL}
        aria-busy={status === LIST_STATUS.LOADING}
        className="flex flex-col gap-4"
      >
        {items.map((item) => (
          <HistoryCard key={item.orderId} item={item} listSearch={listSearch} />
        ))}
      </ul>
      {status === LIST_STATUS.ERROR ? <HistoryLoadError onRetry={onRetry} /> : null}
      {footer}
    </div>
  );
}
