import { ArrowsDownUpIcon } from '@phosphor-icons/react';
import {
  isSearchTooShort,
  MANAGER_SEARCH_MAX_LENGTH,
  type ManagerOrdersSort,
} from '@/shared/staff-api';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import type { OrdersParams } from '../config/list-params';
import { sortLabel } from '../config/sort-labels';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import { type OrdersView, sortParamOf } from '../model/orders-view';
import { FiltersControl } from './FiltersControl';
import { SearchField } from '@/shared/ui/search-field';

type OrdersToolbarProps = {
  view: OrdersView;
  isDesktop: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  courierName: string | null;
  onChange: (patch: Partial<OrdersParams>) => void;
  onCourierChosen: (courierId: number, name: string) => void;
};

export function OrdersToolbar({
  view,
  isDesktop,
  searchText,
  onSearchChange,
  courierName,
  onChange,
  onCourierChosen,
}: OrdersToolbarProps) {
  const sortOptions = view.sorts.map((sort) => ({ value: sort, label: sortLabel(view.tab, sort) }));

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-3">
      <SearchField
        value={searchText}
        label={MANAGER_ORDERS_TEXTS.SEARCH_LABEL}
        clearLabel={MANAGER_ORDERS_TEXTS.SEARCH_CLEAR}
        maxLength={MANAGER_SEARCH_MAX_LENGTH}
        hint={isSearchTooShort(searchText) ? MANAGER_ORDERS_TEXTS.SEARCH_TOO_SHORT : null}
        className="lg:max-w-110 lg:grow"
        placeholder={
          isDesktop
            ? MANAGER_ORDERS_TEXTS.SEARCH_PLACEHOLDER
            : MANAGER_ORDERS_TEXTS.SEARCH_PLACEHOLDER_SHORT
        }
        onChange={onSearchChange}
      />
      <div className="flex gap-3 lg:contents">
        <FiltersControl
          view={view}
          courierName={courierName}
          isDesktop={isDesktop}
          onApply={onChange}
          onCourierChosen={onCourierChosen}
        />
        <Select<ManagerOrdersSort>
          label={MANAGER_ORDERS_TEXTS.SORT}
          labelMode={SELECT_LABEL.HIDDEN}
          icon={isDesktop ? ArrowsDownUpIcon : undefined}
          options={sortOptions}
          value={view.sort}
          onChange={(sort) => onChange({ sort: sortParamOf(view.tab, sort) })}
          className="min-w-0 grow lg:ms-auto lg:grow-0"
          selectClassName="lg:w-auto lg:field-sizing-content"
        />
      </div>
    </div>
  );
}
