import { APP_LOCALE, CHAT_UI_TEXTS } from '@/shared/config';

export type ChatDay<T> = { key: string; label: string; items: T[] };

const dayMonthFormat = new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'long' });
const dayMonthYearFormat = new Intl.DateTimeFormat(APP_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date, now: Date): string {
  if (dayKey(date) === dayKey(now)) {
    return CHAT_UI_TEXTS.TODAY;
  }

  return date.getFullYear() === now.getFullYear()
    ? dayMonthFormat.format(date)
    : dayMonthYearFormat.format(date);
}

export function groupByDay<T>(
  items: readonly T[],
  dateOf: (item: T) => Date,
  nowMs: number,
): ChatDay<T>[] {
  const now = new Date(nowMs);
  const days: ChatDay<T>[] = [];

  for (const item of items) {
    const date = dateOf(item);
    const key = dayKey(date);
    const last = days.at(-1);

    if (last?.key === key) {
      last.items.push(item);
    } else {
      days.push({ key, label: dayLabel(date, now), items: [item] });
    }
  }

  return days;
}
