import type { SupportPendingEvent } from '../types/support.types';
import { summarizeTickets } from './support-events.service';

const ticket = (status: 'open' | 'closed', awaitingStaff: boolean) => ({
  ticketId: 3,
  userId: 7,
  status,
  awaitingStaff,
});
const message = {
  messageId: 1,
  senderId: 7,
  content: 'Текст',
  sentAt: new Date(),
  isRead: false,
  senderFirstName: 'Иван',
  senderLastName: 'Петров',
};

describe('summarizeTickets', () => {
  it('should tell the staff about a new ticket once, not about its first message', () => {
    const pending: SupportPendingEvent[] = [
      { kind: 'message', ticket: ticket('open', true), message, fromStaff: false },
      { kind: 'created', ticket: ticket('open', true) },
    ];

    expect(summarizeTickets(pending)).toEqual([
      { ticket: ticket('open', true), kind: 'created', staffReplied: false },
    ]);
  });

  it('should keep the latest state and remember a staff reply', () => {
    const pending: SupportPendingEvent[] = [
      { kind: 'message', ticket: ticket('open', false), message, fromStaff: true },
      { kind: 'closed', ticket: ticket('closed', false) },
    ];

    expect(summarizeTickets(pending)).toEqual([
      { ticket: ticket('closed', false), kind: 'closed', staffReplied: true },
    ]);
  });
});
