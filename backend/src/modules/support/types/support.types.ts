import type { ListPage } from '@/common/types/page.types';
import type { Transaction } from '@/database/database.module';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { RoleName } from '@/common/enums/role.enum';
import type { SupportTicketStatus, TicketTopic } from '@/common/enums/support-ticket.enum';
import type { SupportMessagePayload } from '@/modules/realtime/types/realtime.types';
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

export type TicketMessage = SupportMessagePayload;

export type TicketMessagesPage = ListPage<TicketMessage>;

export type TicketReadResult = { readCount: number; unreadCount: number };

export type TicketMessageInput = {
  ticketId: number;
  senderId: number;
  text: string;
  fromStaff: boolean;
};

export type SupportTicketState = {
  ticketId: number;
  userId: number;
  status: SupportTicketStatus;
  awaitingStaff: boolean;
};

export type SupportPendingEvent =
  | { kind: 'message'; ticket: SupportTicketState; message: TicketMessageRow; fromStaff: boolean }
  | { kind: 'created' | 'closed'; ticket: SupportTicketState };

export type SupportTransaction = {
  tx: Transaction;
  pending: SupportPendingEvent[];
};

export type MessageViewer = 'author' | 'staff';

export type StaffTicketRow = TicketRow & {
  waitingSec: number | null;
  authorFirstName: string;
  authorLastName: string;
  authorRole: RoleName;
};

export type StaffTicketDetailsRow = StaffTicketRow & {
  authorPhone: string | null;
  closedById: number | null;
  closerFirstName: string | null;
  closerLastName: string | null;
  delivery: TicketDeliveryAddress | null;
};

export type StaffTicketAuthor = { userId: number; name: string; role: RoleName };

export type StaffTicketListItem = Omit<TicketListItem, 'unreadCount' | 'lastMessage'> & {
  waitingSec: number | null;
  author: StaffTicketAuthor;
  lastMessage: { text: string; fromStaff: boolean } | null;
};

export type StaffTicketDetails = Omit<StaffTicketListItem, 'order' | 'author'> & {
  author: StaffTicketAuthor & { phone: string | null };
  order: { orderId: number; status: OrderStatus; deliveryAddress: string } | null;
  closedAt: string | null;
  closedBy: { role: 'author' | 'staff'; name: string } | null;
};

export type StaffTicketsPage = ListPage<StaffTicketListItem>;

export type SupportCounts = { awaiting: number; open: number };
