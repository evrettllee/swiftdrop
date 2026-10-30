import { CLOSED_BY } from '../constants/support-staff.constants';
import type {
  StaffTicketDetails,
  StaffTicketDetailsRow,
  StaffTicketListItem,
  StaffTicketRow,
} from '../types/support.types';
import { previewText, shortAddress, staffName, toTicketListItem } from './support.mapper';

export function toStaffTicketItem(row: StaffTicketRow): StaffTicketListItem {
  const { unreadCount: _unread, lastMessage, ...item } = toTicketListItem(row);

  return {
    ...item,
    waitingSec: row.waitingSec,
    author: {
      userId: row.userId,
      name: `${row.authorFirstName} ${row.authorLastName}`,
      role: row.authorRole,
    },
    lastMessage:
      lastMessage === null
        ? null
        : { text: previewText(row.lastMessageText ?? ''), fromStaff: lastMessage.fromStaff },
  };
}

function closedByOf(row: StaffTicketDetailsRow): StaffTicketDetails['closedBy'] {
  if (row.closedById === null || row.closerFirstName === null || row.closerLastName === null) {
    return null;
  }

  return row.closedById === row.userId
    ? { role: CLOSED_BY.AUTHOR, name: `${row.closerFirstName} ${row.closerLastName}` }
    : { role: CLOSED_BY.STAFF, name: staffName(row.closerFirstName, row.closerLastName, 'staff') };
}

export function toStaffTicketDetails(row: StaffTicketDetailsRow): StaffTicketDetails {
  const item = toStaffTicketItem(row);

  return {
    ...item,
    author: { ...item.author, phone: row.authorPhone },
    order:
      item.order === null || row.delivery === null
        ? null
        : { ...item.order, deliveryAddress: shortAddress(row.delivery) },
    closedAt: row.closedAt?.toISOString() ?? null,
    closedBy: closedByOf(row),
  };
}
