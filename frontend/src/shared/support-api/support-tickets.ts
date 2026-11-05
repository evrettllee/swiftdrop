import { z } from 'zod';
import { dateSchema, type HttpOptions, http, orderStatusSchema } from '@/shared/api';
import { supportTicketStatusSchema } from '@/shared/staff-api';

export const SUPPORT_SIDE = {
  STAFF: 'staff',
  AUTHOR: 'author',
} as const;

export type SupportSide = (typeof SUPPORT_SIDE)[keyof typeof SUPPORT_SIDE];

const BASES: Record<SupportSide, string> = {
  [SUPPORT_SIDE.STAFF]: '/manager/support/tickets',
  [SUPPORT_SIDE.AUTHOR]: '/support/tickets',
};

const BASE = BASES[SUPPORT_SIDE.STAFF];

export function supportTicketsPath(side: SupportSide): string {
  return BASES[side];
}

export const SUPPORT_VIEW = {
  AWAITING: 'awaiting',
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export type SupportView = (typeof SUPPORT_VIEW)[keyof typeof SUPPORT_VIEW];

export const SUPPORT_AUTHOR_ROLE = {
  CLIENT: 'client',
  COURIER: 'courier',
} as const;

export type SupportAuthorRole = (typeof SUPPORT_AUTHOR_ROLE)[keyof typeof SUPPORT_AUTHOR_ROLE];

export const SUPPORT_SORT = {
  LONGEST_WAITING: 'lastMessageAt:asc',
  NEWEST: 'lastMessageAt:desc',
  NEWEST_CREATED: 'createdAt:desc',
  OLDEST_CREATED: 'createdAt:asc',
} as const;

export type SupportSort = (typeof SUPPORT_SORT)[keyof typeof SUPPORT_SORT];

export const CLOSED_BY_ROLE = {
  AUTHOR: 'author',
  STAFF: 'staff',
} as const;

const authorSchema = z.object({
  userId: z.number(),
  name: z.string(),
  role: z.enum(SUPPORT_AUTHOR_ROLE),
});

export const supportTicketItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  topic: z.string(),
  status: supportTicketStatusSchema,
  awaitingStaff: z.boolean(),
  lastMessageAt: dateSchema,
  createdAt: dateSchema,
  waitingSec: z.number().nullable(),
  author: authorSchema,
  order: z.object({ orderId: z.number(), status: orderStatusSchema }).nullable(),
  lastMessage: z.object({ text: z.string(), fromStaff: z.boolean() }).nullable(),
});

export type SupportTicketItem = z.infer<typeof supportTicketItemSchema>;

const ticketsPageSchema = z.object({
  items: z.array(supportTicketItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  until: z.number().nullable(),
});

export type SupportTicketsPage = z.infer<typeof ticketsPageSchema>;

export const supportTicketSchema = supportTicketItemSchema.extend({
  author: authorSchema.extend({ phone: z.string().nullable() }),
  order: z
    .object({ orderId: z.number(), status: orderStatusSchema, deliveryAddress: z.string() })
    .nullable(),
  closedAt: dateSchema.nullable(),
  closedBy: z.object({ role: z.enum(CLOSED_BY_ROLE), name: z.string() }).nullable(),
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;

export type SupportTicketsQuery = {
  view: SupportView;
  authorRole: SupportAuthorRole | null;
  q: string | null;
  sort: SupportSort | null;
  page: number;
  limit: number;
  until: number | null;
};

export function supportTicketPath(side: SupportSide, ticketId: number): string {
  return `${BASES[side]}/${ticketId}`;
}

export async function getSupportTickets(
  query: SupportTicketsQuery,
  options: HttpOptions = {},
): Promise<SupportTicketsPage> {
  const search = new URLSearchParams({
    view: query.view,
    page: String(query.page),
    limit: String(query.limit),
  });

  for (const [name, value] of [
    ['authorRole', query.authorRole],
    ['q', query.q],
    ['sort', query.sort],
    ['until', query.until === null ? null : String(query.until)],
  ] as const) {
    if (value !== null) {
      search.set(name, value);
    }
  }

  return ticketsPageSchema.parse(await http.get(`${BASE}?${search.toString()}`, options));
}

export async function getSupportTicket(
  ticketId: number,
  options: HttpOptions = {},
): Promise<SupportTicket> {
  return supportTicketSchema.parse(
    await http.get(supportTicketPath(SUPPORT_SIDE.STAFF, ticketId), options),
  );
}

export async function closeSupportTicket(ticketId: number): Promise<SupportTicket> {
  return supportTicketSchema.parse(
    await http.post(`${supportTicketPath(SUPPORT_SIDE.STAFF, ticketId)}/close`),
  );
}
