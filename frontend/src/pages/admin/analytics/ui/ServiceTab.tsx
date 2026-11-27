import { CheckIcon, WarningIcon } from '@phosphor-icons/react';
import { memo, useMemo } from 'react';
import type { ServiceAnalytics } from '@/shared/analytics-api';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { VerticalBarChart } from '@/shared/ui/analytics';
import { Panel } from '@/shared/ui/panel';
import {
  TABLE_ALIGN,
  TABLE_SORT,
  Table,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@/shared/ui/table';
import { SERVICE_TEXTS } from '../config/service-tab-texts';
import {
  buildServiceTabView,
  type ExternalServiceRowView,
  type RecentFailureRowView,
} from '../lib/service-view';
import { KpiGrid } from './KpiGrid';

function ExternalServicesPanel({ services }: { services: readonly ExternalServiceRowView[] }) {
  return (
    <Panel title={SERVICE_TEXTS.SERVICES_TITLE} description={SERVICE_TEXTS.SERVICES_SUBTITLE}>
      <div className="flex flex-col">
        {services.map((service) => (
          <div
            key={service.key}
            className="flex items-center justify-between gap-4 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0"
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-body text-fg">{service.label}</span>
              <span className="text-small text-fg-secondary">{service.subtitle}</span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 text-small whitespace-nowrap text-fg">
              {service.failures === 0 ? (
                <CheckIcon
                  size={ICON_SIZE.SMALL}
                  weight={ICON_WEIGHT}
                  aria-hidden="true"
                  className="text-success"
                />
              ) : (
                <WarningIcon
                  size={ICON_SIZE.SMALL}
                  weight={ICON_WEIGHT}
                  aria-hidden="true"
                  className="text-warning"
                />
              )}
              <span>{service.statusText}</span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecentFailuresSection({ recent }: { recent: readonly RecentFailureRowView[] }) {
  return (
    <section aria-labelledby="admin-analytics-recent" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="admin-analytics-recent" className="text-heading-sm font-semibold">
          {SERVICE_TEXTS.RECENT_TITLE}
        </h2>
        <span className="text-caption text-fg-secondary">{SERVICE_TEXTS.RECENT_SUBTITLE}</span>
      </div>
      {recent.length === 0 ? (
        <p className="text-small text-fg-secondary">{SERVICE_TEXTS.RECENT_EMPTY}</p>
      ) : (
        <Table label={SERVICE_TEXTS.RECENT_TITLE}>
          <thead>
            <TableRow>
              <TableHeaderCell sort={TABLE_SORT.DESCENDING}>
                {SERVICE_TEXTS.COL_TIME}
              </TableHeaderCell>
              <TableHeaderCell>{SERVICE_TEXTS.COL_SERVICE}</TableHeaderCell>
              <TableHeaderCell>{SERVICE_TEXTS.COL_REASON}</TableHeaderCell>
              <TableHeaderCell align={TABLE_ALIGN.END}>{SERVICE_TEXTS.COL_REPEATS}</TableHeaderCell>
            </TableRow>
          </thead>
          <tbody>
            {recent.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="whitespace-nowrap text-fg-secondary tabular-nums">
                  {row.time}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <WarningIcon
                      size={ICON_SIZE.SMALL}
                      weight={ICON_WEIGHT}
                      aria-hidden="true"
                      className={row.isServer ? 'text-danger' : 'text-warning'}
                    />
                    <span>{row.serviceLabel}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <span title={row.tooltip}>{row.whatHappened}</span>
                </TableCell>
                <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
                  {row.repeats}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  );
}

type ServiceTabProps = {
  data: ServiceAnalytics;
  isDesktop: boolean;
};

export const ServiceTab = memo(function ServiceTab({ data, isDesktop }: ServiceTabProps) {
  const view = useMemo(() => buildServiceTabView(data), [data]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <KpiGrid items={view.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={SERVICE_TEXTS.ERRORS_TITLE} description={SERVICE_TEXTS.ERRORS_SUBTITLE}>
          <VerticalBarChart
            items={view.errorsBars}
            ariaLabel={SERVICE_TEXTS.ERRORS_TITLE}
            isDesktop={isDesktop}
          />
        </Panel>
        <ExternalServicesPanel services={view.services} />
      </div>
      <RecentFailuresSection recent={view.recent} />
    </div>
  );
});
