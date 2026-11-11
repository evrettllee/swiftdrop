import { ArrowsDownUpIcon } from '@phosphor-icons/react';
import { SearchField } from '@/shared/ui/search-field';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import type { HistoryQuery } from '../api/get-history';
import {
  HISTORY_SEARCH_MAX_LENGTH,
  HISTORY_SEARCH_PATTERN,
  HISTORY_SORT,
  HISTORY_SORTS,
  type HistorySort,
} from '../config/list';
import { HISTORY_TEXTS, SHORT_SORT_LABELS, SORT_LABELS } from '../config/texts';
import type { HistoryFilterParams } from '../lib/history-period';
import { HistoryPeriodControl } from './HistoryPeriodControl';

const SORT_OPTIONS = HISTORY_SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

const SHORT_SORT_OPTIONS = HISTORY_SORTS.map((sort) => ({
  value: sort,
  label: SHORT_SORT_LABELS[sort],
  fullLabel: SORT_LABELS[sort],
}));

type HistoryToolbarProps = {
  period: HistoryFilterParams;
  query: HistoryQuery;
  now: Date;
  isDesktop: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onPeriodChange: (filters: HistoryFilterParams) => void;
  onSortChange: (sort: HistorySort | null) => void;
};

export function HistoryToolbar({
  period,
  query,
  now,
  isDesktop,
  searchText,
  onSearchChange,
  onPeriodChange,
  onSortChange,
}: HistoryToolbarProps) {
  const text = searchText.trim();
  const isNotNumber = text !== '' && !HISTORY_SEARCH_PATTERN.test(text);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <SearchField
        value={searchText}
        label={HISTORY_TEXTS.SEARCH_LABEL}
        clearLabel={HISTORY_TEXTS.SEARCH_CLEAR}
        maxLength={HISTORY_SEARCH_MAX_LENGTH}
        hint={isNotNumber ? HISTORY_TEXTS.SEARCH_NOT_NUMBER : null}
        className="lg:max-w-110 lg:grow"
        placeholder={HISTORY_TEXTS.SEARCH_PLACEHOLDER}
        onChange={onSearchChange}
      />
      <div className="grid grid-cols-2 gap-3 lg:contents">
        <HistoryPeriodControl
          value={period}
          query={query}
          now={now}
          isDesktop={isDesktop}
          onApply={onPeriodChange}
        />
        <Select<HistorySort>
          label={HISTORY_TEXTS.SORT}
          labelMode={SELECT_LABEL.HIDDEN}
          icon={isDesktop ? ArrowsDownUpIcon : undefined}
          options={isDesktop ? SORT_OPTIONS : SHORT_SORT_OPTIONS}
          value={query.sort ?? HISTORY_SORT.NEWEST}
          onChange={(sort) => onSortChange(sort === HISTORY_SORT.NEWEST ? null : sort)}
          className="min-w-0 lg:ms-auto lg:shrink-0"
          selectClassName="truncate lg:w-auto lg:field-sizing-content"
        />
      </div>
    </div>
  );
}
