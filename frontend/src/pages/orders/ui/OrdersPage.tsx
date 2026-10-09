import { PackageIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT, LIST_STATUS } from '@/shared/config';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import { ORDER_LIST_FILTER, ORDER_LIST_FILTERS } from '../config/list';
import { ORDER_TAB_LABELS, ORDERS_EMPTY_TEXTS, ORDERS_TEXTS } from '../config/texts';
import type { OrderListFilter } from '../model/order-list';
import { useOrderCounts } from '../model/useOrderCounts';
import { useOrdersList } from '../model/useOrdersList';
import { OrdersList } from './OrdersList';

const TABS_ID_PREFIX = 'orders-filter';

function NewOrderButton() {
  return (
    <LinkButton
      to={APP_ROUTES.ORDER_NEW}
      icon={<PlusIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
    >
      {ORDERS_TEXTS.NEW_ORDER}
    </LinkButton>
  );
}

export function OrdersPage() {
  const [filter, setFilter] = useState<OrderListFilter>(ORDER_LIST_FILTER.ALL);
  const list = useOrdersList(filter);
  const counts = useOrderCounts();
  // No orders at all: the page shows only the empty state, without the tabs.
  const hasNoOrders =
    filter === ORDER_LIST_FILTER.ALL && list.status === LIST_STATUS.READY && list.total === 0;
  const tabs = ORDER_LIST_FILTERS.map((id) => ({
    id,
    label: ORDER_TAB_LABELS[id],
    count: counts[id],
  }));

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <header className="flex items-center justify-between gap-6">
        <h1 className="text-heading-md font-bold text-balance lg:text-heading-lg">
          {ORDERS_TEXTS.PAGE_TITLE}
        </h1>
        {hasNoOrders ? null : (
          <div className="hidden lg:block">
            <NewOrderButton />
          </div>
        )}
      </header>
      {hasNoOrders ? (
        <EmptyState icon={PackageIcon} {...ORDERS_EMPTY_TEXTS[ORDER_LIST_FILTER.ALL]}>
          <NewOrderButton />
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4 lg:gap-6">
          <Tabs
            layout="fit"
            tabs={tabs}
            value={filter}
            onChange={setFilter}
            label={ORDERS_TEXTS.TABS_LABEL}
            idPrefix={TABS_ID_PREFIX}
          />
          {ORDER_LIST_FILTERS.map((id) => (
            <TabPanel key={id} idPrefix={TABS_ID_PREFIX} id={id} activeId={filter}>
              <OrdersList filter={filter} list={list} />
            </TabPanel>
          ))}
        </div>
      )}
    </div>
  );
}
