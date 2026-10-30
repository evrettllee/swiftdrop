import type { TicketDetailsRow, TicketMessageRow } from '../types/support.types';
import {
  previewText,
  ticketTitle,
  toTicketDetails,
  toTicketListItem,
  toTicketMessage,
} from './support.mapper';

const AUTHOR_ID = 7;
const AT = new Date('2026-10-30T10:00:00.000Z');

const ROW: TicketDetailsRow = {
  ticketId: 3,
  userId: AUTHOR_ID,
  topic: 'order_problem',
  subject: null,
  status: 'open',
  awaitingStaff: false,
  lastMessageAt: AT,
  createdAt: AT,
  closedAt: null,
  orderId: 12,
  orderStatus: 'in_transit',
  lastMessageText: 'Ответ',
  lastMessageSenderId: 99,
  lastMessageSentAt: AT,
  unreadCount: 2,
  delivery: { city: 'Минск', street: 'ул. Ленина', house: '5', apartment: '12' },
};

const STAFF_MESSAGE: TicketMessageRow = {
  messageId: 40,
  senderId: 99,
  content: 'Мы проверим',
  sentAt: AT,
  isRead: false,
  senderFirstName: 'Анна',
  senderLastName: 'Секретова',
};

describe('ticket titles and previews', () => {
  it('should title a ticket by its subject for other and by the topic label otherwise', () => {
    expect(ticketTitle('other', 'Свой вопрос')).toBe('Свой вопрос');
    expect(ticketTitle('client_unreachable', null)).toBe('Клиент не выходит на связь');
  });

  it('should cut the last message to 120 characters', () => {
    expect(previewText('я'.repeat(200))).toHaveLength(120);
    expect(previewText('Коротко')).toBe('Коротко');
  });
});

describe('toTicketListItem and toTicketDetails', () => {
  it('should give the list row with the unread count and the last message from staff', () => {
    expect(toTicketListItem({ ...ROW, lastMessageText: 'я'.repeat(150) })).toEqual({
      id: 3,
      title: 'Проблема с заказом',
      topic: 'order_problem',
      status: 'open',
      awaitingStaff: false,
      lastMessageAt: AT.toISOString(),
      createdAt: AT.toISOString(),
      order: { orderId: 12, status: 'in_transit' },
      lastMessage: { text: 'я'.repeat(120), fromStaff: true, createdAt: AT.toISOString() },
      unreadCount: 2,
    });
  });

  it('should add the short delivery address and the closing time to the details', () => {
    const details = toTicketDetails({ ...ROW, status: 'closed', closedAt: AT });

    expect(details.order).toEqual({
      orderId: 12,
      status: 'in_transit',
      deliveryAddress: 'Минск, ул. Ленина, 5, кв. 12',
    });
    expect(details.closedAt).toBe(AT.toISOString());
  });

  it('should give no order to a ticket without one', () => {
    const details = toTicketDetails({ ...ROW, orderId: null, orderStatus: null, delivery: null });

    expect(details.order).toBeNull();
  });
});

describe('toTicketMessage', () => {
  it('should name a staff member by the first name and support only', () => {
    const message = toTicketMessage(STAFF_MESSAGE, AUTHOR_ID);

    expect(message).toEqual({
      id: 40,
      text: 'Мы проверим',
      createdAt: AT.toISOString(),
      fromStaff: true,
      authorName: 'Анна, поддержка',
      isRead: false,
    });
    expect(JSON.stringify(message)).not.toContain('Секретова');
  });

  it('should name the author by the full name', () => {
    const message = toTicketMessage(
      { ...STAFF_MESSAGE, senderId: AUTHOR_ID, senderFirstName: 'Иван', senderLastName: 'Петров' },
      AUTHOR_ID,
    );

    expect(message).toMatchObject({ fromStaff: false, authorName: 'Иван Петров' });
  });
});
