import { EXPORT_SECTION } from '@/modules/manager/constants/analytics-export.constants';
import type { ExportSheet } from '@/modules/manager/types/manager-export.types';
import {
  type SheetColumn,
  shareOf,
  sheetOf,
} from '@/modules/manager/utils/analytics-export/export-sheet';
import { datesOf } from '@/modules/manager/utils/analytics-period';
import type {
  AdminExportDay,
  AdminSummaryInput,
} from '@/modules/admin/types/admin-analytics-export.types';

const COLUMNS: SheetColumn<AdminExportDay>[] = [
  { header: 'Дата', kind: 'day', width: 12, value: (row) => row.date },
  { header: 'Заказов оформлено', kind: 'number', width: 18, value: (row) => row.ordersCreated },
  { header: 'Доставлено', kind: 'number', width: 12, value: (row) => row.delivered },
  { header: 'Выручка BYN', kind: 'money', width: 13, value: (row) => row.revenue },
  {
    header: 'Доставлено вовремя %',
    kind: 'percent',
    width: 20,
    value: (row) => shareOf(row.onTime, row.onTimeTotal),
  },
  { header: 'Новые клиенты', kind: 'number', width: 14, value: (row) => row.newClients },
  { header: 'Обращений', kind: 'number', width: 11, value: (row) => row.tickets },
  { header: 'Ошибки сервера', kind: 'number', width: 15, value: (row) => row.serverErrors },
];

export function adminDaysSheet(rows: readonly AdminExportDay[]): ExportSheet {
  return sheetOf(EXPORT_SECTION.DAYS, COLUMNS, rows);
}

export type AdminDaySources = Pick<
  AdminSummaryInput,
  'business' | 'delivery' | 'users' | 'support' | 'service'
> & {
  created: readonly { date: string; count: number }[];
};

function byDate<T extends { date: string }>(rows: readonly T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.date, row]));
}

export function toExportDays(from: string, to: string, sources: AdminDaySources): AdminExportDay[] {
  const created = byDate(sources.created);
  const revenue = byDate(sources.business.revenueByDay);
  const onTime = byDate(sources.delivery.onTimeByDay);
  const clients = byDate(sources.users.newClientsByDay);
  const tickets = byDate(sources.support.firstResponseByDay);
  const errors = byDate(sources.service.serverErrorsByDay);

  return datesOf(from, to).map((date) => ({
    date,
    ordersCreated: created.get(date)?.count ?? 0,
    delivered: revenue.get(date)?.delivered ?? 0,
    revenue: revenue.get(date)?.revenue ?? 0,
    onTime: onTime.get(date)?.onTime ?? 0,
    onTimeTotal: onTime.get(date)?.total ?? 0,
    newClients: clients.get(date)?.count ?? 0,
    tickets: tickets.get(date)?.tickets ?? 0,
    serverErrors: errors.get(date)?.count ?? 0,
  }));
}
