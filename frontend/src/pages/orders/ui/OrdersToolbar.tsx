import { ArrowsDownUpIcon } from '@phosphor-icons/react';
import type { Period } from '@/shared/lib/calendar';
import { SearchField } from '@/shared/ui/search-field';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import type { OrdersQuery } from '../api/list-orders';
import {
  ORDERS_SEARCH_MAX_LENGTH,
  ORDERS_SORT,
  ORDERS_SORTS,
  type OrdersSort,
} from '../config/list';
import { ORDERS_TEXTS, SHORT_SORT_LABELS, SORT_LABELS } from '../config/texts';
import { PeriodControl } from './PeriodControl';

const SORT_OPTIONS = ORDERS_SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

const SHORT_SORT_OPTIONS = ORDERS_SORTS.map((sort) => ({
  value: sort,
  label: SHORT_SORT_LABELS[sort],
  fullLabel: SORT_LABELS[sort],
}));

type OrdersToolbarProps = {
  query: OrdersQuery;
  now: Date;
  isDesktop: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onPeriodChange: (period: Period) => void;
  onSortChange: (sort: OrdersSort | null) => void;
};

export function OrdersToolbar({
  query,
  now,
  isDesktop,
  searchText,
  onSearchChange,
  onPeriodChange,
  onSortChange,
}: OrdersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <SearchField
        value={searchText}
        label={ORDERS_TEXTS.SEARCH_LABEL}
        clearLabel={ORDERS_TEXTS.SEARCH_CLEAR}
        maxLength={ORDERS_SEARCH_MAX_LENGTH}
        className="lg:max-w-110 lg:grow"
        placeholder={
          isDesktop ? ORDERS_TEXTS.SEARCH_PLACEHOLDER : ORDERS_TEXTS.SEARCH_PLACEHOLDER_SHORT
        }
        onChange={onSearchChange}
      />
      <div className="grid grid-cols-2 gap-3 lg:contents">
        <PeriodControl query={query} now={now} isDesktop={isDesktop} onApply={onPeriodChange} />
        <Select<OrdersSort>
          label={ORDERS_TEXTS.SORT}
          labelMode={SELECT_LABEL.HIDDEN}
          icon={isDesktop ? ArrowsDownUpIcon : undefined}
          options={isDesktop ? SORT_OPTIONS : SHORT_SORT_OPTIONS}
          value={query.sort ?? ORDERS_SORT.NEWEST}
          onChange={(sort) => onSortChange(sort === ORDERS_SORT.NEWEST ? null : sort)}
          className="min-w-0 lg:ms-auto lg:shrink-0"
          selectClassName="truncate lg:w-auto lg:field-sizing-content"
        />
      </div>
    </div>
  );
}
