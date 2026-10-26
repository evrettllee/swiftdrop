import type { ChatMessage } from '@/shared/api';
import { APP_LOCALE } from '@/shared/config';
import { CHAT_TEXTS } from '../config/texts';

export type ChatDay = { key: string; label: string; messages: ChatMessage[] };

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
    return CHAT_TEXTS.TODAY;
  }

  return date.getFullYear() === now.getFullYear()
    ? dayMonthFormat.format(date)
    : dayMonthYearFormat.format(date);
}

export function groupMessagesByDay(messages: readonly ChatMessage[], nowMs: number): ChatDay[] {
  const now = new Date(nowMs);
  const days: ChatDay[] = [];

  for (const message of messages) {
    const key = dayKey(message.sentAt);
    const last = days.at(-1);

    if (last?.key === key) {
      last.messages.push(message);
    } else {
      days.push({ key, label: dayLabel(message.sentAt, now), messages: [message] });
    }
  }

  return days;
}
