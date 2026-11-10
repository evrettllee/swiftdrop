import { useCallback, useMemo, useState } from 'react';
import {
  type OrderAction,
  OrderActionDialog,
  type StaffOrderTarget,
} from '@/features/manager-order-actions';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { useMediaQuery } from '@/shared/lib/dom';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import {
  ORDERS_TABS,
  ORDERS_TABS_ID_PREFIX,
  type OrdersTab,
  TAB_COUNT_KEY,
  TAB_STATUS_GROUP,
} from '../config/list';
import { MANAGER_ORDERS_TEXTS, TAB_LABELS } from '../config/texts';
import { type RowAction, rowActionTarget } from '../lib/row-actions';
import { appliedFilters, emptyResultText, exportScope } from '../model/applied-filters';
import { useManagerOrders } from '../model/useManagerOrders';
import { AppliedFilters } from './AppliedFilters';
import { NewOrdersNotice } from './NewOrdersNotice';
import { OrdersContent } from './OrdersContent';
import { OrdersHeader } from './OrdersHeader';
import { OrdersToolbar } from './OrdersToolbar';

export function ManagerOrdersPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const now = useMinuteNow();
  const nowDate = useMemo(() => new Date(now), [now]);
  const orders = useManagerOrders(isDesktop);
  const { params, view, counts, changeParams } = orders;
  const [rowAction, setRowAction] = useState<{
    target: StaffOrderTarget;
    action: OrderAction;
  } | null>(null);
  const openRowAction = useCallback<RowAction>(
    (order, action) => setRowAction({ target: rowActionTarget(order), action }),
    [],
  );
  const chips = appliedFilters(view.filter, nowDate, orders.courierName);
  const tabs = ORDERS_TABS.map((id) => ({
    id,
    label: TAB_LABELS[id],
    count: counts === null ? null : counts[TAB_COUNT_KEY[id]],
  }));

  function changeTab(tab: OrdersTab): void {
    changeParams({ status: TAB_STATUS_GROUP[tab], sort: null });
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <OrdersHeader
        isDesktop={isDesktop}
        query={view.query}
        count={counts === null ? null : counts[TAB_COUNT_KEY[view.tab]]}
        scope={exportScope(view, chips)}
      />
      <div className="flex flex-col gap-4 lg:gap-6">
        <Tabs
          layout="fit"
          tabs={tabs}
          value={view.tab}
          onChange={changeTab}
          label={MANAGER_ORDERS_TEXTS.TABS_LABEL}
          idPrefix={ORDERS_TABS_ID_PREFIX}
        />
        {ORDERS_TABS.map((id) => (
          <TabPanel key={id} idPrefix={ORDERS_TABS_ID_PREFIX} id={id} activeId={view.tab}>
            <div className="flex flex-col gap-4 lg:gap-6">
              <OrdersToolbar
                view={view}
                isDesktop={isDesktop}
                searchText={params.searchText}
                onSearchChange={params.setSearchText}
                courierName={orders.courierName}
                onChange={changeParams}
                onCourierChosen={orders.rememberCourier}
              />
              <AppliedFilters filters={chips} onChange={changeParams} />
              <NewOrdersNotice count={orders.newCount} onShow={orders.showNew} />
              <OrdersContent
                isDesktop={isDesktop}
                view={view}
                values={params.values}
                page={orders.page}
                feed={orders.feed}
                now={now}
                emptyText={emptyResultText(view, nowDate)}
                onChange={changeParams}
                onAction={openRowAction}
              />
            </div>
          </TabPanel>
        ))}
      </div>
      <OrderActionDialog
        target={rowAction?.target ?? null}
        action={rowAction?.action ?? null}
        onClose={() => setRowAction(null)}
        onChanged={orders.refresh}
      />
    </div>
  );
}
