import { memo, useMemo } from 'react';
import type { DeliveryAnalytics } from '@/shared/analytics-api';
import { HorizontalBars, LineChart } from '@/shared/ui/analytics';
import { Panel } from '@/shared/ui/panel';
import {
  TABLE_ALIGN,
  TABLE_SORT,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@/shared/ui/table';
import { DELIVERY_TEXTS } from '../config/tab-texts';
import { buildDeliveryTabView, type ZoneRowView } from '../lib/delivery-view';
import { KpiGrid } from './KpiGrid';

function ZonesSection({ zones }: { zones: readonly ZoneRowView[] }) {
  return (
    <section aria-labelledby="admin-analytics-zones" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="admin-analytics-zones" className="text-heading-sm font-semibold">
          {DELIVERY_TEXTS.ZONES_TITLE}
        </h2>
        <span className="text-caption text-fg-secondary">{DELIVERY_TEXTS.ZONES_SUBTITLE}</span>
      </div>
      {zones.length === 0 ? (
        <p className="text-small text-fg-secondary">{DELIVERY_TEXTS.ZONES_EMPTY}</p>
      ) : (
        <Table label={DELIVERY_TEXTS.ZONES_TITLE}>
          <thead>
            <TableRow>
              <TableHeaderCell>{DELIVERY_TEXTS.COL_ZONE}</TableHeaderCell>
              <TableHeaderCell align={TABLE_ALIGN.END} sort={TABLE_SORT.DESCENDING}>
                {DELIVERY_TEXTS.COL_ORDERS}
              </TableHeaderCell>
              <TableHeaderCell align={TABLE_ALIGN.END}>
                {DELIVERY_TEXTS.COL_ON_TIME}
              </TableHeaderCell>
              <TableHeaderCell align={TABLE_ALIGN.END}>
                {DELIVERY_TEXTS.COL_AVG_TIME}
              </TableHeaderCell>
              <TableHeaderCell align={TABLE_ALIGN.END}>{DELIVERY_TEXTS.COL_MANUAL}</TableHeaderCell>
              <TableHeaderCell align={TABLE_ALIGN.END}>
                {DELIVERY_TEXTS.COL_REVENUE}
              </TableHeaderCell>
            </TableRow>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <TableRow key={zone.key}>
                <TableCell className="font-semibold">{zone.name}</TableCell>
                <TableCell align={TABLE_ALIGN.END} className="font-semibold tabular-nums">
                  {zone.orders}
                </TableCell>
                <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
                  {zone.onTime}
                </TableCell>
                <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
                  {zone.avgTime}
                </TableCell>
                <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
                  {zone.manual}
                </TableCell>
                <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
                  {zone.revenue}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  );
}

type DeliveryTabProps = {
  data: DeliveryAnalytics;
  isDesktop: boolean;
};

export const DeliveryTab = memo(function DeliveryTab({ data, isDesktop }: DeliveryTabProps) {
  const view = useMemo(() => buildDeliveryTabView(data), [data]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <KpiGrid items={view.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={DELIVERY_TEXTS.ON_TIME_TITLE} description={DELIVERY_TEXTS.ON_TIME_SUBTITLE}>
          <LineChart
            items={view.onTimePoints}
            ariaLabel={DELIVERY_TEXTS.ON_TIME_TITLE}
            isDesktop={isDesktop}
            emptyText={DELIVERY_TEXTS.ON_TIME_EMPTY}
          />
        </Panel>
        <Panel title={DELIVERY_TEXTS.OFFERS_TITLE} description={view.offersSubtitle}>
          <HorizontalBars items={view.offers} trackSize="sm" />
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {view.offersSummary.map((row) => (
              <div key={row.key} className="flex items-baseline justify-between gap-4 text-small">
                <span className="text-fg-secondary">{row.label}</span>
                <span className="font-semibold text-fg tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <ZonesSection zones={view.zones} />
    </div>
  );
});
