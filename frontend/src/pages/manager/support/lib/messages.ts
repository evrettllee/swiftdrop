import type { SupportMessage } from '@/shared/support-api';

export function mergeMessages(
  current: readonly SupportMessage[],
  incoming: readonly SupportMessage[],
): SupportMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].toSorted((left, right) => left.id - right.id);
}

export function markStaffMessagesRead(messages: readonly SupportMessage[]): SupportMessage[] {
  return messages.map((message) =>
    message.fromStaff && !message.isRead ? { ...message, isRead: true } : message,
  );
}

export function lastAuthorMessageId(messages: readonly SupportMessage[]): number | null {
  return messages.findLast((message) => !message.fromStaff)?.id ?? null;
}
