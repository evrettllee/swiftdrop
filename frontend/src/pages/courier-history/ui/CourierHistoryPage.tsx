import { ClockCounterClockwiseIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { LIST_STATUS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { HISTORY_TEXTS } from '../config/texts';
import { useHistoryList } from '../model/useHistoryList';
import { HistoryList } from './HistoryList';
import { HistoryListSkeleton } from './HistoryListSkeleton';
import { HistoryLoadError } from './HistoryLoadError';

// The finished orders of the courier: the skeleton, the failure, the empty state or the cards.
export function CourierHistoryPage() {
  const list = useHistoryList();
  const hasItems = list.items.length > 0;
  let content: ReactNode;

  if (hasItems) {
    content = <HistoryList list={list} />;
  } else if (list.status === LIST_STATUS.LOADING) {
    content = <HistoryListSkeleton />;
  } else if (list.status === LIST_STATUS.ERROR) {
    content = <HistoryLoadError onRetry={list.retry} />;
  } else {
    content = (
      <EmptyState
        icon={ClockCounterClockwiseIcon}
        title={HISTORY_TEXTS.EMPTY_TITLE}
        text={HISTORY_TEXTS.EMPTY_TEXT}
      >
        <LinkButton to={APP_ROUTES.COURIER_WORK}>{HISTORY_TEXTS.TO_WORK}</LinkButton>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageTitle>{HISTORY_TEXTS.PAGE_TITLE}</PageTitle>
      {content}
    </div>
  );
}
