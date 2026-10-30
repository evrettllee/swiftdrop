import type { ListPage } from '@/common/types/page.types';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { SupportTicketStatus, TicketTopic } from '@/common/enums/support-ticket.enum';
import type { SupportAuthorRole } from '../constants/support.constants';

export type SupportAuthor = { userId: number; role: SupportAuthorRole };

export type TicketRow = {
  ticketId: number;
  userId: number;
  topic: TicketTopic;
  subject: string | null;
  status: SupportTicketStatus;
  awaitingStaff: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  closedAt: Date | null;
  orderId: number | null;
  orderStatus: OrderStatus | null;
  lastMessageText: string | null;
  lastMessageSenderId: number | null;
  lastMessageSentAt: Date | null;
  unreadCount: number;
};

export type TicketDeliveryAddress = {
  city: string;
  street: string;
  house: string;
  apartment: string | null;
};

export type TicketDetailsRow = TicketRow & { delivery: TicketDeliveryAddress | null };

export type TicketLastMessage = { text: string; fromStaff: boolean; createdAt: string };

export type TicketListItem = {
  id: number;
  title: string;
  topic: TicketTopic;
  status: SupportTicketStatus;
  awaitingStaff: boolean;
  lastMessageAt: string;
  createdAt: string;
  order: { orderId: number; status: OrderStatus } | null;
  lastMessage: TicketLastMessage | null;
  unreadCount: number;
};

export type TicketDetails = Omit<TicketListItem, 'order'> & {
  order: { orderId: number; status: OrderStatus; deliveryAddress: string } | null;
  closedAt: string | null;
};

export type TicketsPage = ListPage<TicketListItem>;

export type TicketMessageRow = {
  messageId: number;
  senderId: number;
  content: string | null;
  sentAt: Date;
  isRead: boolean;
  senderFirstName: string;
  senderLastName: string;
};

export type TicketMessage = {
  id: number;
  text: string;
  createdAt: string;
  fromStaff: boolean;
  authorName: string;
  isRead: boolean;
};

export type TicketMessagesPage = ListPage<TicketMessage>;

export type TicketReadResult = { readCount: number; unreadCount: number };

export type TicketMessageInput = {
  ticketId: number;
  senderId: number;
  text: string;
  fromStaff: boolean;
};

export type WrittenTicketMessage = { messageId: number; sentAt: Date };
