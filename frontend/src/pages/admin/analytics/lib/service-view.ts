import type { ServiceAnalytics } from '@/shared/analytics-api';
import { formatDayMonth, formatDayShort, formatMinskShortDateTime } from '@/shared/lib/calendar';
import { formatWhole, pluralize } from '@/shared/lib/format';
import type { VerticalBarDatum } from '@/shared/ui/analytics';
import { ADMIN_SERVICE_LABELS, adminFailureText } from '../config/service-failures';
import { SERVICE_TEXTS } from '../config/service-tab-texts';
import { ERROR_FORMS } from '../config/texts';
import type { KpiCardView } from './business-view';
import { numericDeltaChange } from './kpi-helpers';

export type ExternalServiceRowView = {
  key: string;
  label: string;
  subtitle: string;
  failures: number;
  statusText: string;
};

export type RecentFailureRowView = {
  key: string;
  time: string;
  serviceLabel: string;
  isServer: boolean;
  whatHappened: string;
  tooltip: string;
  repeats: string;
};

export type ServiceTabView = {
  kpis: readonly KpiCardView[];
  errorsBars: readonly VerticalBarDatum[];
  services: readonly ExternalServiceRowView[];
  recent: readonly RecentFailureRowView[];
};

function buildServiceKpis(data: ServiceAnalytics): readonly KpiCardView[] {
  const { serverErrors, externalFailures, mailFailures, savedRateUsed } = data.kpis;

  return [
    {
      key: 'serverErrors',
      label: SERVICE_TEXTS.KPI_SERVER_ERRORS,
      value: formatWhole(serverErrors.value),
      change: numericDeltaChange(
        serverErrors.value,
        serverErrors.previous,
        false,
        null,
        formatWhole,
      ),
    },
    {
      key: 'externalFailures',
      label: SERVICE_TEXTS.KPI_EXTERNAL_FAILURES,
      value: formatWhole(externalFailures.value.failures),
      change: numericDeltaChange(
        externalFailures.value.failures,
        externalFailures.previous.failures,
        false,
        SERVICE_TEXTS.servicesCount(externalFailures.value.services),
        formatWhole,
      ),
    },
    {
      key: 'mailFailures',
      label: SERVICE_TEXTS.KPI_MAIL_FAILURES,
      value: formatWhole(mailFailures.count),
      change: {
        tone: 'neutral',
        text:
          mailFailures.lastAt === null
            ? SERVICE_TEXTS.MAIL_NONE
            : SERVICE_TEXTS.lastMail(mailFailures.lastAt),
      },
    },
    {
      key: 'savedRateUsed',
      label: SERVICE_TEXTS.KPI_SAVED_RATE,
      value: formatWhole(savedRateUsed),
      change: { tone: 'neutral', text: SERVICE_TEXTS.SAVED_RATE_NOTE },
    },
  ];
}

export function buildServiceTabView(data: ServiceAnalytics): ServiceTabView {
  const errorsBars: VerticalBarDatum[] = data.serverErrorsByDay.map((day) => ({
    key: day.date,
    xLabel: formatDayShort(day.date),
    value: day.count,
    tooltipTitle: `${formatDayMonth(day.date)}: ${formatWhole(day.count)} ${pluralize(day.count, ERROR_FORMS)}`,
  }));

  const services: ExternalServiceRowView[] = data.services.map((row) => {
    const codeText = row.lastCode === null ? null : adminFailureText(row.service, row.lastCode);
    const timeText = row.lastAt === null ? null : formatMinskShortDateTime(row.lastAt);
    const subtitleParts = [codeText, timeText].filter((part): part is string => part !== null);

    return {
      key: row.service,
      label: ADMIN_SERVICE_LABELS[row.service],
      subtitle:
        row.failures === 0 || subtitleParts.length === 0
          ? SERVICE_TEXTS.SERVICE_NONE_SUBTITLE
          : subtitleParts.join(', '),
      failures: row.failures,
      statusText:
        row.failures === 0 ? SERVICE_TEXTS.SERVICE_OK : SERVICE_TEXTS.failuresCount(row.failures),
    };
  });

  const recent: RecentFailureRowView[] = data.recent.map((row, index) => ({
    key: `${row.lastAt}-${row.service}-${row.code}-${index}`,
    time: formatMinskShortDateTime(row.lastAt),
    serviceLabel: ADMIN_SERVICE_LABELS[row.service],
    isServer: row.service === 'server',
    whatHappened: adminFailureText(row.service, row.code),
    tooltip: row.message,
    repeats: formatWhole(row.repeats),
  }));

  return {
    kpis: buildServiceKpis(data),
    errorsBars,
    services,
    recent,
  };
}
