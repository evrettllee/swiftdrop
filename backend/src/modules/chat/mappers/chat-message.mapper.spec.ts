import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import type { ChatMessageRow } from '../types/chat.types';
import { canSendInOrder, toChatHistoryPage, toChatMessage } from './chat-message.mapper';

const CLIENT_USER_ID = 10;
const COURIER_USER_ID = 20;
const SENT_AT = '2026-10-22T12:00:00.000Z';

function row(messageId: number, senderId = CLIENT_USER_ID): ChatMessageRow {
  return {
    messageId,
    senderId,
    content: `text ${messageId}`,
    sentAt: new Date(SENT_AT),
    isRead: false,
  };
}

// Newest first, as the query reads them.
function rowsDown(from: number, to: number): ChatMessageRow[] {
  return Array.from({ length: from - to + 1 }, (_, index) => row(from - index));
}

describe('toChatMessage', () => {
  it.each([
    [CLIENT_USER_ID, ROLE.CLIENT],
    [COURIER_USER_ID, ROLE.COURIER],
  ])('should tell the side of sender %i: %s, without user ids', (senderId, senderRole) => {
    expect(toChatMessage(row(1, senderId), CLIENT_USER_ID)).toEqual({
      messageId: 1,
      senderRole,
      content: 'text 1',
      sentAt: SENT_AT,
      isRead: false,
    });
  });
});

describe('toChatHistoryPage', () => {
  it('should drop the extra row, put the oldest first and point at it', () => {
    const page = toChatHistoryPage(rowsDown(10, 7), 3, CLIENT_USER_ID);

    expect(page.items.map((item) => item.messageId)).toEqual([8, 9, 10]);
    expect(page.nextBeforeId).toBe(8);
  });

  it.each([
    ['the page is full', 3],
    ['the page is short', 2],
  ])('should end the history when %s and nothing is left', (_, size) => {
    const page = toChatHistoryPage(rowsDown(size, 1), 3, CLIENT_USER_ID);

    expect(page.items).toHaveLength(size);
    expect(page.nextBeforeId).toBeNull();
  });

  it('should give an empty page for an empty chat', () => {
    expect(toChatHistoryPage([], 3, CLIENT_USER_ID)).toEqual({ items: [], nextBeforeId: null });
  });
});

describe('canSendInOrder', () => {
  it.each<[OrderStatus, boolean]>([
    [ORDER_STATUS.PENDING, false],
    [ORDER_STATUS.CONFIRMED, false],
    [ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT, false],
    [ORDER_STATUS.COURIER_ASSIGNED, true],
    [ORDER_STATUS.PICKED_UP, true],
    [ORDER_STATUS.IN_TRANSIT, true],
    [ORDER_STATUS.DELIVERED, false],
    [ORDER_STATUS.CANCELLED, false],
    [ORDER_STATUS.REJECTED, false],
  ])('should give %s with a courier: %s', (status, expected) => {
    expect(canSendInOrder(status, true)).toBe(expected);
  });

  it('should not let anyone write without a courier', () => {
    expect(canSendInOrder(ORDER_STATUS.COURIER_ASSIGNED, false)).toBe(false);
  });

  it('should cover every status', () => {
    expect(Object.values(ORDER_STATUS)).toHaveLength(9);
  });
});
