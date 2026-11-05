import { z } from 'zod';
import {
  ApiError,
  dateSchema,
  HTTP_STATUS,
  type HttpOptions,
  http,
  NETWORK_ERROR_STATUS,
} from '@/shared/api';
import { type SupportSide, supportTicketPath } from './support-tickets';

function messagesPath(side: SupportSide, ticketId: number): string {
  return `${supportTicketPath(side, ticketId)}/messages`;
}

export const SUPPORT_MESSAGES_LIMIT = 30;
export const SUPPORT_MESSAGE_MAX_LENGTH = 1000;

export const supportMessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  createdAt: dateSchema,
  fromStaff: z.boolean(),
  authorName: z.string(),
  isRead: z.boolean(),
});

export type SupportMessage = z.infer<typeof supportMessageSchema>;

const messagesPageSchema = z.object({
  items: z.array(supportMessageSchema),
  nextCursor: z.string().nullable(),
});

export type SupportMessagesPage = z.infer<typeof messagesPageSchema>;

export async function getSupportMessages(
  side: SupportSide,
  ticketId: number,
  cursor: string | null,
  options: HttpOptions = {},
): Promise<SupportMessagesPage> {
  const search = new URLSearchParams({ limit: String(SUPPORT_MESSAGES_LIMIT) });

  if (cursor !== null) {
    search.set('cursor', cursor);
  }

  return messagesPageSchema.parse(
    await http.get(`${messagesPath(side, ticketId)}?${search.toString()}`, options),
  );
}

export async function sendSupportMessage(
  side: SupportSide,
  ticketId: number,
  text: string,
): Promise<SupportMessage> {
  const answer = z
    .object({ message: supportMessageSchema })
    .parse(await http.post(messagesPath(side, ticketId), { text }));

  return answer.message;
}

export async function markSupportRead(side: SupportSide, ticketId: number): Promise<void> {
  await http.post(`${supportTicketPath(side, ticketId)}/read`);
}

export const SUPPORT_SEND_FAILURE = {
  CLOSED: 'closed',
  TOO_MANY: 'too_many',
  NETWORK: 'network',
  OTHER: 'other',
} as const;

export type SupportSendFailure = (typeof SUPPORT_SEND_FAILURE)[keyof typeof SUPPORT_SEND_FAILURE];

const ticketClosedSchema = z.object({ code: z.literal('TICKET_CLOSED') });

export function supportSendFailureOf(error: unknown): SupportSendFailure {
  if (!(error instanceof ApiError)) {
    return SUPPORT_SEND_FAILURE.NETWORK;
  }

  if (error.status === HTTP_STATUS.CONFLICT && ticketClosedSchema.safeParse(error.body).success) {
    return SUPPORT_SEND_FAILURE.CLOSED;
  }

  if (error.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return SUPPORT_SEND_FAILURE.TOO_MANY;
  }

  return error.status === NETWORK_ERROR_STATUS
    ? SUPPORT_SEND_FAILURE.NETWORK
    : SUPPORT_SEND_FAILURE.OTHER;
}
