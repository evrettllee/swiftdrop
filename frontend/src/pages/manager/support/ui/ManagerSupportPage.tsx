import { useMemo } from 'react';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMinuteNow } from '@/shared/lib/clock';
import { useMediaQuery } from '@/shared/lib/dom';
import { useListParams } from '@/shared/lib/list-params';
import { SUPPORT_VIEW, type SupportView } from '@/shared/support-api';
import { PageTitle } from '@/shared/ui/page-title';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import { DEFAULT_SORTS, SUPPORT_PARAMS_CONFIG } from '../config/params';
import { MANAGER_SUPPORT_TEXTS as TEXTS, VIEW_LABELS } from '../config/texts';
import { queueEmpty } from '../lib/queue-empty';
import { countFilters } from '../model/support-filters';
import { useSupportQueue } from '../model/useSupportQueue';
import { SupportAppliedFilters } from './SupportAppliedFilters';
import { SupportFilters } from './SupportFilters';
import { SupportToolbar } from './SupportToolbar';
import { SupportLayout } from './SupportLayout';
import { TicketQueue } from './TicketQueue';

const VIEWS: readonly SupportView[] = [
  SUPPORT_VIEW.AWAITING,
  SUPPORT_VIEW.OPEN,
  SUPPORT_VIEW.CLOSED,
];

const TABS_ID = 'support-tabs';

export function ManagerSupportPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const nowMs = useMinuteNow();
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const params = useListParams(SUPPORT_PARAMS_CONFIG);
  const { values, update } = params;
  const queue = useSupportQueue(params);
  const counts = queue.counts;
  const tabs = VIEWS.map((id) => ({ id, label: VIEW_LABELS[id], count: counts?.[id] ?? null }));
  const select = (ticket: number | null) => update({ ticket, page: values.page });
  const hasFilters = values.role !== null || countFilters(values) > 0;
  const isFiltered = queue.search !== null || hasFilters;

  const queueView = (
    <TicketQueue
      list={queue.list}
      page={values.page}
      empty={queueEmpty(values.view, queue.search, hasFilters)}
      isFiltered={isFiltered}
      selectedId={values.ticket}
      onSelect={select}
      onPage={(page) => update({ page })}
    />
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageTitle>{TEXTS.TITLE}</PageTitle>
      <Tabs
        layout="fit"
        tabs={tabs}
        value={values.view}
        onChange={(view) => update({ view })}
        label={TEXTS.TABS}
        idPrefix={TABS_ID}
      />
      {VIEWS.map((view) => (
        <TabPanel key={view} idPrefix={TABS_ID} id={view} activeId={values.view}>
          <SupportToolbar
            isDesktop={isDesktop}
            searchText={params.searchText}
            role={values.role}
            sort={values.sort ?? DEFAULT_SORTS[values.view]}
            filters={
              <SupportFilters
                isDesktop={isDesktop}
                value={values}
                view={values.view}
                applied={queue.filters}
                now={now}
                onApply={update}
              />
            }
            onSearchChange={params.setSearchText}
            onRoleChange={(role) => update({ role })}
            onSortChange={(sort) =>
              update({ sort: sort === DEFAULT_SORTS[values.view] ? null : sort })
            }
          />
          <SupportAppliedFilters value={values} now={now} onChange={update} />
          <SupportLayout
            isDesktop={isDesktop}
            queue={queueView}
            ticketId={values.ticket}
            onChanged={queue.reload}
            onBack={() => select(null)}
          />
        </TabPanel>
      ))}
    </div>
  );
}
