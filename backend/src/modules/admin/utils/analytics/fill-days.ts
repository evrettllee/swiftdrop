import { datesOf } from '@/modules/manager/utils/analytics-period';

export function fillDays<T extends object>(
  from: string,
  to: string,
  rows: readonly (T & { date: string })[],
  empty: T,
): (T & { date: string })[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));

  return datesOf(from, to).map((date) => byDate.get(date) ?? { ...empty, date });
}
