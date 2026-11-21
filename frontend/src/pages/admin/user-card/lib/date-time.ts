import { formatShortDate, formatTime } from '@/shared/lib/format';

export function formatDateTime(date: Date): string {
  return `${formatShortDate(date)}, ${formatTime(date)}`;
}
