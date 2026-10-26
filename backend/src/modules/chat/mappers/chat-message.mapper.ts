import { CHAT_WRITABLE_STATUSES } from '@/common/constants/orders.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { CHAT_ERROR_MESSAGES, CHAT_NOT_OPEN_STATUSES } from '../constants/chat.constants';
import type { ChatHistoryPage, ChatMessage, ChatMessageRow } from '../types/chat.types';

const writableStatuses = new Set<OrderStatus>(CHAT_WRITABLE_STATUSES);
const notOpenStatuses = new Set<OrderStatus>(CHAT_NOT_OPEN_STATUSES);

// The side is told by the sender: the owner of the order is the client, anyone else its courier.
export function toChatMessage(row: ChatMessageRow, clientUserId: number): ChatMessage {
  return {
    messageId: row.messageId,
    senderRole: row.senderId === clientUserId ? ROLE.CLIENT : ROLE.COURIER,
    content: row.content ?? '',
    sentAt: row.sentAt.toISOString(),
    isRead: row.isRead,
  };
}

// Rows come newest first, one more than the page: that one only tells there is an older page.
export function toChatHistoryPage(
  rows: readonly ChatMessageRow[],
  limit: number,
  clientUserId: number,
): ChatHistoryPage {
  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return {
    items: page.map((row) => toChatMessage(row, clientUserId)).reverse(),
    nextBeforeId: hasMore ? page[page.length - 1].messageId : null,
  };
}

export function canSendInOrder(status: OrderStatus, hasCourier: boolean): boolean {
  return hasCourier && writableStatuses.has(status);
}

// Why a message is refused in an order that takes none: no courier yet, or the order is over.
export function sendRefusalMessage(status: OrderStatus): string {
  return notOpenStatuses.has(status)
    ? CHAT_ERROR_MESSAGES.CHAT_NOT_OPEN
    : CHAT_ERROR_MESSAGES.CHAT_CLOSED;
}
