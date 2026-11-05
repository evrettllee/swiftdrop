import { ClockCounterClockwiseIcon } from '@phosphor-icons/react';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { AppliedFilters } from '@/shared/ui/chip';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { FILTERS_RESET } from '../config/list-params';
import { HISTORY_TEXTS } from '../config/texts';
import { appliedFilters } from '../lib/applied-filters';
import { useHistory } from '../model/useHistory';
import { HistoryContent } from './HistoryContent';
import { HistorySummary } from './HistorySummary';
import { HistoryToolbar } from './HistoryToolbar';

export function CourierHistoryPage() {
  const history = useHistory();
  const { params, range, now } = history;
  const { period, from, to, q } = params.values;
  const filters = appliedFilters(params.values);
  const empty =
    q === null
      ? { title: HISTORY_TEXTS.EMPTY_PERIOD_TITLE, text: HISTORY_TEXTS.EMPTY_PERIOD_TEXT }
      : { title: HISTORY_TEXTS.NOT_FOUND_TITLE, text: HISTORY_TEXTS.NOT_FOUND_TEXT };

  if (history.hasNoHistory) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8">
        <PageTitle>{HISTORY_TEXTS.PAGE_TITLE}</PageTitle>
        <EmptyState
          icon={ClockCounterClockwiseIcon}
          title={HISTORY_TEXTS.EMPTY_TITLE}
          text={HISTORY_TEXTS.EMPTY_TEXT}
        >
          <LinkButton to={APP_ROUTES.COURIER_WORK}>{HISTORY_TEXTS.TO_WORK}</LinkButton>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageTitle>{HISTORY_TEXTS.PAGE_TITLE}</PageTitle>
      <HistoryToolbar
        period={{ period, from, to }}
        query={{ q, from: range.from, to: range.to, sort: params.values.sort }}
        now={now}
        isDesktop={history.isDesktop}
        searchText={params.searchText}
        onSearchChange={params.setSearchText}
        onPeriodChange={params.update}
        onSortChange={(sort) => params.update({ sort })}
      />
      <AppliedFilters
        label={HISTORY_TEXTS.APPLIED_FILTERS}
        resetAllLabel={HISTORY_TEXTS.RESET_ALL}
        removeLabel={HISTORY_TEXTS.removeFilter}
        filters={history.isDesktop || history.isEmpty ? filters : []}
        onRemove={(id) => {
          const filter = filters.find((item) => item.id === id);

          if (filter !== undefined) {
            params.update(filter.reset);
          }
        }}
        onResetAll={() => params.update(FILTERS_RESET)}
      />
      <HistorySummary period={range} summary={history.summary} now={now} />
      <HistoryContent history={history} empty={empty} />
    </div>
  );
}
