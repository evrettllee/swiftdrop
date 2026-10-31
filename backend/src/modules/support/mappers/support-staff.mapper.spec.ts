import type { StaffTicketDetailsRow, TicketMessageRow } from '../types/support.types';
import { toStaffTicketDetails, toStaffTicketItem } from './support-staff.mapper';
import { toTicketMessage } from './support.mapper';

const AT = new Date('2026-10-30T10:00:00.000Z');

const ROW: StaffTicketDetailsRow = {
  ticketId: 3,
  userId: 7,
  topic: 'payment',
  subject: null,
  status: 'open',
  awaitingStaff: true,
  lastMessageAt: AT,
  createdAt: AT,
  closedAt: null,
  orderId: null,
  orderStatus: null,
  lastMessageText: 'я'.repeat(150),
  lastMessageSenderId: 7,
  lastMessageSentAt: AT,
  unreadCount: 0,
  waitingSec: 125,
  authorFirstName: 'Иван',
  authorLastName: 'Петров',
  authorRole: 'client',
  authorPhone: '+375291234567',
  closedById: null,
  closerFirstName: null,
  closerLastName: null,
  delivery: null,
};

describe('toStaffTicketItem', () => {
  it('should give the waiting time, the author and the cut last message', () => {
    expect(toStaffTicketItem(ROW)).toEqual({
      id: 3,
      title: 'Оплата',
      topic: 'payment',
      status: 'open',
      awaitingStaff: true,
      lastMessageAt: AT.toISOString(),
      createdAt: AT.toISOString(),
      waitingSec: 125,
      author: { userId: 7, name: 'Иван Петров', role: 'client' },
      order: null,
      lastMessage: { text: 'я'.repeat(120), fromStaff: false },
    });
  });

  it('should keep the phone of the author for the details only', () => {
    expect(JSON.stringify(toStaffTicketItem(ROW))).not.toContain('+375291234567');
    expect(toStaffTicketDetails(ROW).author.phone).toBe('+375291234567');
  });
});

describe('toStaffTicketDetails closedBy', () => {
  it('should tell a ticket closed by its author from one closed by the staff', () => {
    const closed = { ...ROW, status: 'closed' as const, closedAt: AT, waitingSec: null };

    expect(
      toStaffTicketDetails({
        ...closed,
        closedById: 7,
        closerFirstName: 'Иван',
        closerLastName: 'Петров',
      }).closedBy,
    ).toEqual({ role: 'author', name: 'Иван Петров' });
    expect(
      toStaffTicketDetails({
        ...closed,
        closedById: 50,
        closerFirstName: 'Елена',
        closerLastName: 'Жукова',
      }).closedBy,
    ).toEqual({ role: 'staff', name: 'Елена Ж.' });
    expect(toStaffTicketDetails(ROW).closedBy).toBeNull();
  });
});

describe('toTicketMessage by the reader', () => {
  const staffMessage: TicketMessageRow = {
    messageId: 1,
    senderId: 50,
    content: 'Ответ',
    sentAt: AT,
    isRead: true,
    senderFirstName: 'Елена',
    senderLastName: 'Жукова',
  };

  it('should name a staff member for the author and for the staff differently', () => {
    expect(toTicketMessage(staffMessage, 7, 'author').authorName).toBe('Елена, поддержка');
    expect(toTicketMessage(staffMessage, 7, 'staff').authorName).toBe('Елена Ж.');
  });

  it('should name the author in full for both', () => {
    const fromAuthor = {
      ...staffMessage,
      senderId: 7,
      senderFirstName: 'Иван',
      senderLastName: 'Петров',
    };

    expect(toTicketMessage(fromAuthor, 7, 'author').authorName).toBe('Иван Петров');
    expect(toTicketMessage(fromAuthor, 7, 'staff').authorName).toBe('Иван Петров');
  });
});
