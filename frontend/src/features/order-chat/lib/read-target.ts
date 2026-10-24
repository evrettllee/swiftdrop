import type { ChatMessage, ChatSenderRole } from '@/shared/api';

export function getReadTargetId(
  messages: readonly ChatMessage[],
  ownRole: ChatSenderRole,
): number | null {
  let lastIncomingId: number | null = null;
  let hasUnread = false;

  for (const message of messages) {
    if (message.senderRole !== ownRole) {
      lastIncomingId = Math.max(lastIncomingId ?? 0, message.messageId);
      hasUnread ||= !message.isRead;
    }
  }

  return hasUnread ? lastIncomingId : null;
}
