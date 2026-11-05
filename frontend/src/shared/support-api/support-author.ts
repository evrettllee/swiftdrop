import { z } from 'zod';
import {
  ApiError,
  dateSchema,
  HTTP_STATUS,
  type HttpOptions,
  http,
  orderStatusSchema,
} from '@/shared/api';
import { type SupportTicketStatus, supportTicketStatusSchema } from '@/shared/staff-api';
import { SUPPORT_SIDE, supportTicketPath, supportTicketsPath } from './support-tickets';

export const SUPPORT_TOPIC = {
  ORDER_PROBLEM: 'order_problem',
  PAYMENT: 'payment',
  ACCOUNT: 'account',
  CLIENT_UNREACHABLE: 'client_unreachable',
  APP: 'app',
  OTHER: 'other',
} as const;

export type SupportTopic = (typeof SUPPORT_TOPIC)[keyof typeof SUPPORT_TOPIC];

export const SUPPORT_SUBJECT_MAX_LENGTH = 80;

export const myTicketItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  topic: z.string(),
  status: supportTicketStatusSchema,
  awaitingStaff: z.boolean(),
  lastMessageAt: dateSchema,
  createdAt: dateSchema,
  order: z.object({ orderId: z.number(), status: orderStatusSchema }).nullable(),
  lastMessage: z
    .object({ text: z.string(), fromStaff: z.boolean(), createdAt: dateSchema })
    .nullable(),
  unreadCount: z.number(),
});

export type MyTicketItem = z.infer<typeof myTicketItemSchema>;

const myTicketsPageSchema = z.object({
  items: z.array(myTicketItemSchema),
  nextCursor: z.string().nullable(),
  total: z.number().optional(),
});

export type MyTicketsPage = z.infer<typeof myTicketsPageSchema>;

export const myTicketSchema = myTicketItemSchema.extend({
  order: z
    .object({ orderId: z.number(), status: orderStatusSchema, deliveryAddress: z.string() })
    .nullable(),
  closedAt: dateSchema.nullable(),
});

export type MyTicket = z.infer<typeof myTicketSchema>;

export type MyTicketsQuery = {
  status: SupportTicketStatus;
  cursor: string | null;
  limit: number;
};

export async function getMyTickets(
  query: MyTicketsQuery,
  options: HttpOptions = {},
): Promise<MyTicketsPage> {
  const search = new URLSearchParams({ status: query.status, limit: String(query.limit) });

  if (query.cursor !== null) {
    search.set('cursor', query.cursor);
  }

  return myTicketsPageSchema.parse(
    await http.get(`${supportTicketsPath(SUPPORT_SIDE.AUTHOR)}?${search.toString()}`, options),
  );
}

export async function getMyTicket(ticketId: number, options: HttpOptions = {}): Promise<MyTicket> {
  return myTicketSchema.parse(
    await http.get(supportTicketPath(SUPPORT_SIDE.AUTHOR, ticketId), options),
  );
}

export type NewTicket = {
  topic: SupportTopic;
  subject: string | null;
  orderId: number | null;
  message: string;
};

export async function createMyTicket(ticket: NewTicket): Promise<MyTicket> {
  const body = {
    topic: ticket.topic,
    message: ticket.message,
    ...(ticket.subject === null ? {} : { subject: ticket.subject }),
    ...(ticket.orderId === null ? {} : { orderId: ticket.orderId }),
  };

  return myTicketSchema.parse(await http.post(supportTicketsPath(SUPPORT_SIDE.AUTHOR), body));
}

export const CREATE_TICKET_FAILURE = {
  ALREADY_OPEN: 'already_open',
  TOO_MANY: 'too_many',
  INVALID: 'invalid',
  OTHER: 'other',
} as const;

export type CreateTicketFailure =
  | { kind: typeof CREATE_TICKET_FAILURE.ALREADY_OPEN; ticketId: number | null }
  | { kind: typeof CREATE_TICKET_FAILURE.TOO_MANY }
  | {
      kind: typeof CREATE_TICKET_FAILURE.INVALID;
      message: string;
      fields: Partial<Record<string, string>>;
    }
  | { kind: typeof CREATE_TICKET_FAILURE.OTHER; error: unknown };

const alreadyOpenSchema = z.object({
  code: z.literal('TICKET_ALREADY_OPEN'),
  ticketId: z.number().nullable().optional(),
});

export function createTicketFailureOf(error: unknown): CreateTicketFailure {
  if (!(error instanceof ApiError)) {
    return { kind: CREATE_TICKET_FAILURE.OTHER, error };
  }

  const alreadyOpen = alreadyOpenSchema.safeParse(error.body);

  if (error.status === HTTP_STATUS.CONFLICT && alreadyOpen.success) {
    return {
      kind: CREATE_TICKET_FAILURE.ALREADY_OPEN,
      ticketId: alreadyOpen.data.ticketId ?? null,
    };
  }

  if (error.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return { kind: CREATE_TICKET_FAILURE.TOO_MANY };
  }

  if (error.status === HTTP_STATUS.BAD_REQUEST) {
    return {
      kind: CREATE_TICKET_FAILURE.INVALID,
      message: error.message,
      fields: Object.fromEntries(error.fieldErrors.map((item) => [item.field, item.message])),
    };
  }

  return { kind: CREATE_TICKET_FAILURE.OTHER, error };
}
