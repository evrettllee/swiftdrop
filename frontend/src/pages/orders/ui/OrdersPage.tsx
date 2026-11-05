import { PackageIcon, PlusIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { APP_ROUTES } from '@/shared/routes';
import { LinkButton } from '@/shared/ui/button';
import { EmptyState, placePrimaryAction } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import { ORDERS_TAB, ORDERS_TABS, ORDERS_TABS_ID_PREFIX } from '../config/list';
import {
  EMPTY_TAB_TEXTS,
  NO_ORDERS_TEXTS,
  NOT_FOUND_TEXTS,
  ORDER_TAB_LABELS,
  ORDERS_TEXTS,
} from '../config/texts';
import { appliedFilters } from '../lib/applied-filters';
import { useMyOrders } from '../model/useMyOrders';
import { AppliedFilters } from './AppliedFilters';
import { OrdersContent } from './OrdersContent';
import { OrdersToolbar } from './OrdersToolbar';

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
  const orders = useMyOrders();
  const { params, query, tab, counts } = orders;
  const nowMs = useMinuteNow();
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const filters = appliedFilters(params.values, now);
  const hasFilters = query.q !== null || query.from !== null || query.to !== null;
  const hasNoOrders = !hasFilters && counts.all === 0;
  const empty = hasFilters
    ? { ...NOT_FOUND_TEXTS, isSearch: true }
    : { ...EMPTY_TAB_TEXTS[tab], isSearch: false };
  const tabs = ORDERS_TABS.map((id) => ({ id, label: ORDER_TAB_LABELS[id], count: counts[id] }));
  const newOrder = placePrimaryAction(<NewOrderButton />, {
    isLoading: !hasFilters && counts.all === null,
    isEmpty: hasNoOrders,
  });

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex items-center justify-between gap-6">
        <PageTitle>{ORDERS_TEXTS.PAGE_TITLE}</PageTitle>
        {newOrder.header === null ? null : <div className="hidden lg:block">{newOrder.header}</div>}
      </header>
      {hasNoOrders ? (
        <EmptyState icon={PackageIcon} {...NO_ORDERS_TEXTS}>
          {newOrder.empty}
        </EmptyState>
      ) : (
        <>
          <Tabs
            layout="fit"
            tabs={tabs}
            value={tab}
            onChange={(next) => params.update({ status: next === ORDERS_TAB.ALL ? null : next })}
            label={ORDERS_TEXTS.TABS_LABEL}
            idPrefix={ORDERS_TABS_ID_PREFIX}
          />
          <OrdersToolbar
            query={query}
            now={now}
            isDesktop={orders.isDesktop}
            searchText={params.searchText}
            onSearchChange={params.setSearchText}
            onPeriodChange={({ from, to }) => params.update({ from, to })}
            onSortChange={(sort) => params.update({ sort })}
          />
          <AppliedFilters
            filters={filters}
            isShown={orders.isDesktop || orders.isEmpty}
            onChange={params.update}
          />
          {ORDERS_TABS.map((id) => (
            <TabPanel key={id} idPrefix={ORDERS_TABS_ID_PREFIX} id={id} activeId={tab}>
              <OrdersContent orders={orders} empty={empty} />
            </TabPanel>
          ))}
        </>
      )}
    </div>
  );
}
