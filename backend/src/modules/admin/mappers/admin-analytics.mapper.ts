import type { Compared } from '../types/admin-analytics.types';

export type BusinessKpiRow = {
  isCurrent: boolean;
  ordersCreated: number;
  revenue: number;
  delivered: number;
  averageCheck: number | null;
  refundAmount: number;
  refundOrders: number;
};

export type DeliveryKpiRow = {
  isCurrent: boolean;
  onTime: number;
  onTimeTotal: number;
  averageDeliveryMinutes: number | null;
  auto: number;
  manual: number;
  averageSearchSeconds: number | null;
};

export function splitPeriods<T extends { isCurrent: boolean }>(rows: readonly T[]) {
  const current = rows.find((row) => row.isCurrent);
  const previous = rows.find((row) => !row.isCurrent);

  if (!current || !previous) {
    throw new Error('Analytics query returned no row for a period');
  }

  return { current, previous };
}

export function compare<T, R>(rows: { current: T; previous: T }, pick: (row: T) => R): Compared<R> {
  return { value: pick(rows.current), previous: pick(rows.previous) };
}
