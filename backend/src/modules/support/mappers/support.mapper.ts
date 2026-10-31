import type { TicketTopic } from '@/common/enums/support-ticket.enum';
import {
  LAST_MESSAGE_PREVIEW_LENGTH,
  STAFF_AUTHOR_SUFFIX,
  TICKET_TOPIC_LABELS,
} from '../constants/support.constants';
import type {
  MessageViewer,
  TicketDeliveryAddress,
  TicketDetails,
  TicketDetailsRow,
  TicketListItem,
  TicketMessage,
  TicketMessageRow,
  TicketRow,
} from '../types/support.types';

export function ticketTitle(topic: TicketTopic, subject: string | null): string {
  return subject ?? TICKET_TOPIC_LABELS[topic];
}

const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function firstGraphemes(text: string, count: number): string {
  return Array.from(GRAPHEMES.segment(text), ({ segment }) => segment)
    .slice(0, count)
    .join('');
}

export function previewText(text: string): string {
  return firstGraphemes(text, LAST_MESSAGE_PREVIEW_LENGTH);
}

export function shortAddress({ city, street, house, apartment }: TicketDeliveryAddress): string {
  const building = `${street}, ${house}`;
  const place = apartment ? `${building}, кв. ${apartment}` : building;

  return `${city}, ${place}`;
}

export function toTicketListItem(row: TicketRow): TicketListItem {
  return {
    id: row.ticketId,
    title: ticketTitle(row.topic, row.subject),
    topic: row.topic,
    status: row.status,
    awaitingStaff: row.awaitingStaff,
    lastMessageAt: row.lastMessageAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    order:
      row.orderId === null || row.orderStatus === null
        ? null
        : { orderId: row.orderId, status: row.orderStatus },
    lastMessage:
      row.lastMessageSentAt === null || row.lastMessageSenderId === null
        ? null
        : {
            text: previewText(row.lastMessageText ?? ''),
            fromStaff: row.lastMessageSenderId !== row.userId,
            createdAt: row.lastMessageSentAt.toISOString(),
          },
    unreadCount: row.unreadCount,
  };
}

export function toTicketDetails(row: TicketDetailsRow): TicketDetails {
  const item = toTicketListItem(row);

  return {
    ...item,
    order:
      item.order === null || row.delivery === null
        ? null
        : { ...item.order, deliveryAddress: shortAddress(row.delivery) },
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}

export function staffName(firstName: string, lastName: string, viewer: MessageViewer): string {
  return viewer === 'staff'
    ? `${firstName} ${firstGraphemes(lastName, 1)}.`
    : `${firstName}, ${STAFF_AUTHOR_SUFFIX}`;
}

export function toTicketMessage(
  row: TicketMessageRow,
  authorId: number,
  viewer: MessageViewer = 'author',
): TicketMessage {
  const fromStaff = row.senderId !== authorId;

  return {
    id: row.messageId,
    text: row.content ?? '',
    createdAt: row.sentAt.toISOString(),
    fromStaff,
    authorName: fromStaff
      ? staffName(row.senderFirstName, row.senderLastName, viewer)
      : `${row.senderFirstName} ${row.senderLastName}`,
    isRead: row.isRead,
  };
}
