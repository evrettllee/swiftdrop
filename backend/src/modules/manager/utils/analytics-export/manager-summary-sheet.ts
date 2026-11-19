import {
  EXPORT_SECTION,
  EXPORT_SHEET_NAMES,
} from '@/modules/manager/constants/analytics-export.constants';
import type {
  AnalyticsKpiValues,
  AnalyticsSummary,
} from '@/modules/manager/types/manager-analytics.types';
import type {
  ExportCell,
  ExportCellKind,
  ExportColumn,
  ExportSheet,
} from '@/modules/manager/types/manager-export.types';
import { fromPercent, moneyOf, periodText, typed } from './export-sheet';

type KpiLine = [string, ExportCellKind, (kpis: AnalyticsKpiValues) => number | null];

const COLUMNS: ExportColumn[] = [
  { header: 'Показатель', kind: 'text', width: 30 },
  { header: 'Значение', kind: 'number', width: 24 },
  { header: 'Предыдущий период', kind: 'number', width: 24 },
];

const LINES: KpiLine[] = [
  ['Доставлено', 'number', (k) => k.delivered.delivered],
  ['Оформлено заказов', 'number', (k) => k.delivered.total],
  ['Вовремя', 'percent', (k) => fromPercent(k.onTime.pct)],
  ['Среднее время доставки, мин', 'decimal', (k) => k.avgDeliveryMin],
  ['Отменено', 'percent', (k) => fromPercent(k.cancelled.pct)],
  ['Отменено заказов', 'number', (k) => k.cancelled.count],
  ['Отменено клиентом', 'number', (k) => k.cancelled.by.client],
  ['Отменено системой', 'number', (k) => k.cancelled.by.system],
  ['Отменено сотрудником', 'number', (k) => k.cancelled.by.staff],
  ['Выручка, BYN', 'money', (k) => moneyOf(k.revenue.total)],
  ['Средний чек, BYN', 'money', (k) => moneyOf(k.revenue.avgCheck)],
  ['Поиск курьера, мин', 'decimal', (k) => k.courierSearch.avgMin],
  ['Назначено вручную', 'number', (k) => k.courierSearch.manual],
];

function side({ kpis }: AnalyticsSummary, pick: 'current' | 'previous'): AnalyticsKpiValues {
  return {
    delivered: kpis.delivered[pick],
    onTime: kpis.onTime[pick],
    avgDeliveryMin: kpis.avgDeliveryMin[pick],
    cancelled: kpis.cancelled[pick],
    revenue: kpis.revenue[pick],
    courierSearch: kpis.courierSearch[pick],
  };
}

export function managerSummarySheet(summary: AnalyticsSummary): ExportSheet {
  const { from, to, previousFrom, previousTo } = summary.period;
  const current = side(summary, 'current');
  const previous = side(summary, 'previous');
  const rows: ExportCell[][] = [
    ['Период', periodText(from, to), null],
    ['Сравнение с', periodText(previousFrom, previousTo), null],
    ...LINES.map(([label, kind, pick]): ExportCell[] => [
      label,
      typed(pick(current), kind),
      typed(pick(previous), kind),
    ]),
  ];

  return { name: EXPORT_SHEET_NAMES[EXPORT_SECTION.SUMMARY], table: { columns: COLUMNS, rows } };
}
