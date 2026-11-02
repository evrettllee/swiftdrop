import { ArrowsDownUpIcon } from '@phosphor-icons/react';
import type { ManagerOrdersSort } from '@/shared/staff-api';
import { Select, SELECT_LABEL } from '@/shared/ui/select';
import type { OrdersParams } from '../config/list-params';
import { MANAGER_ORDERS_TEXTS, SORT_LABELS } from '../config/texts';
import { type OrdersView, sortParamOf } from '../model/orders-view';
import { FiltersControl } from './FiltersControl';
import { SearchField } from './SearchField';

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
  const sortOptions = view.sorts.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-3">
      <SearchField
        value={searchText}
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
