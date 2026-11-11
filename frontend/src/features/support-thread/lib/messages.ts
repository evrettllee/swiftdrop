import { SUPPORT_SIDE, type SupportMessage, type SupportSide } from '@/shared/support-api';

export function isOwnMessage(message: SupportMessage, side: SupportSide): boolean {
  return message.fromStaff === (side === SUPPORT_SIDE.STAFF);
}

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

export function markOwnMessagesRead(
  messages: readonly SupportMessage[],
  side: SupportSide,
): SupportMessage[] {
  return messages.map((message) =>
    isOwnMessage(message, side) && !message.isRead ? { ...message, isRead: true } : message,
  );
}

export function lastIncomingMessageId(
  messages: readonly SupportMessage[],
  side: SupportSide,
): number | null {
  return messages.findLast((message) => !isOwnMessage(message, side))?.id ?? null;
}
