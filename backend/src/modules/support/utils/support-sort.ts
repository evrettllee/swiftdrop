import { SORT_DIRECTION, SORT_VALUE_KIND } from '@/common/constants/list.constants';
import type { SortSpec } from '@/common/database/list-sort';
import { messages, supportTickets } from '@/database/schema';

export const TICKETS_SORT: SortSpec<'lastMessageAt' | 'createdAt'> = {
  whitelist: {
    lastMessageAt: { column: supportTickets.lastMessageAt, kind: SORT_VALUE_KIND.TIMESTAMP },
    createdAt: { column: supportTickets.createdAt, kind: SORT_VALUE_KIND.TIMESTAMP },
  },
  idColumn: supportTickets.ticketId,
  defaultSort: { key: 'lastMessageAt', direction: SORT_DIRECTION.DESC },
};

export const TICKET_MESSAGES_SORT: SortSpec<'id'> = {
  whitelist: { id: { column: messages.messageId, kind: SORT_VALUE_KIND.INTEGER } },
  idColumn: messages.messageId,
  defaultSort: { key: 'id', direction: SORT_DIRECTION.DESC },
};
